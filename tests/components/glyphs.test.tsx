import { render, screen } from "@testing-library/react-native";
import type { ReactTestRendererJSON } from "react-test-renderer";
import { StyleSheet, View } from "react-native";

import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { CHEVRON_ARMS, ChevronGlyph } from "@/components/ui/icons/chevron-glyph";
import { TabGlyph, tabGlyphDrawing, type TabIdentity } from "@/components/ui/icons/tab-glyph";
import { TabShapeGlyph, type TabShape } from "@/components/ui/icons/tab-shape-glyph";

function renderedStyle() {
  const json = screen.toJSON();
  const node = Array.isArray(json) ? json[0] : json;

  return StyleSheet.flatten(node?.props.style);
}

function renderedProps() {
  const json = screen.toJSON();
  const node = Array.isArray(json) ? json[0] : json;

  return { type: node?.type, props: node?.props as Record<string, unknown> };
}

function renderedGlyph(): ReactTestRendererJSON | null {
  const json = screen.toJSON();

  return (Array.isArray(json) ? json[0] : json) ?? null;
}

function elementsOf(node: ReactTestRendererJSON | null): readonly ReactTestRendererJSON[] {
  return (node?.children ?? []).filter(
    (child): child is ReactTestRendererJSON => typeof child !== "string",
  );
}

/**
 * The square is turned 45° clockwise, so the corner where the two borders meet is what ends up at
 * the chevron's point. Each row names the corner and where that corner lands.
 */
describe("ChevronGlyph", () => {
  it("should draw the top-left corner, which lands at the top, for up", () => {
    expect(CHEVRON_ARMS.up).toEqual({ borderLeftWidth: 1.5, borderTopWidth: 1.5 });
  });

  it("should draw the top-right corner, which lands at the right, for right", () => {
    expect(CHEVRON_ARMS.right).toEqual({ borderRightWidth: 1.5, borderTopWidth: 1.5 });
  });

  it("should draw the bottom-right corner, which lands at the bottom, for down", () => {
    expect(CHEVRON_ARMS.down).toEqual({ borderBottomWidth: 1.5, borderRightWidth: 1.5 });
  });

  it("should draw the bottom-left corner, which lands at the left, for left", () => {
    expect(CHEVRON_ARMS.left).toEqual({ borderBottomWidth: 1.5, borderLeftWidth: 1.5 });
  });

  it("should turn the square a quarter of the way round, which is what carries the corner", async () => {
    await render(<ChevronGlyph color="#0B72E7" direction="left" />);

    const style = renderedStyle();

    expect(style.transform).toEqual([{ rotate: "45deg" }]);
    expect(style.borderBottomWidth).toBe(1.5);
    expect(style.borderLeftWidth).toBe(1.5);
    expect(style.borderTopWidth).toBeUndefined();
    expect(style.borderRightWidth).toBeUndefined();
  });

  it("should say nothing of itself, because the control around it carries the name", async () => {
    await render(<ChevronGlyph color="#0B72E7" direction="down" />);

    expect(renderedProps().props.accessibilityElementsHidden).toBe(true);
    expect(renderedProps().props.importantForAccessibility).toBe("no-hide-descendants");
  });
});

/**
 * The notch in the foot is what makes the shape a bookmark and no border can cut one, so the shape
 * is the platform's own symbol. Under this preset the symbol view renders, which is what these
 * read; where it cannot, `fallback` is the drawn shape that stands in.
 */
describe("BookmarkGlyph", () => {
  it("should name the outlined symbol on each platform while nothing is marked", async () => {
    await render(<BookmarkGlyph color="#0B72E7" filled={false} />);

    expect(renderedProps().props.name).toBe("bookmark");
  });

  it("should name the solid symbol on each platform once something is", async () => {
    await render(<BookmarkGlyph color="#0B72E7" filled />);

    expect(renderedProps().props.name).toBe("bookmark.fill");
  });

  it("should take the color it was given and stand on one line of body text", async () => {
    await render(<BookmarkGlyph color="#0B72E7" filled />);

    const { props } = renderedProps();

    expect(props.tintColor).toBe("#0B72E7");
    expect(StyleSheet.flatten(props.style)).toMatchObject({ height: 18, width: 18 });
  });

  it("should carry a drawn shape to stand in where no symbol set does", async () => {
    await render(<BookmarkGlyph color="#0B72E7" filled={false} />);

    expect(renderedProps().props.fallback).toBeTruthy();
  });

  it("should say nothing of itself, because the control around it carries the name", async () => {
    await render(<BookmarkGlyph color="#0B72E7" filled />);

    expect(renderedProps().props.accessibilityElementsHidden).toBe(true);
    expect(renderedProps().props.importantForAccessibility).toBe("no-hide-descendants");
  });
});

describe("TabGlyph", () => {
  const GLYPH_COLOR = "#0B72E7";

  const ELEMENT_COUNTS: Readonly<Record<TabIdentity, number>> = {
    cards: 2,
    decks: 3,
    rules: 4,
    saved: 1,
  };

  const IDENTITIES = Object.keys(ELEMENT_COUNTS) as readonly TabIdentity[];

  const COLOR_PROPERTIES: readonly string[] = ["backgroundColor", "borderColor", "tintColor"];

  function silhouetteOf(glyph: ReactTestRendererJSON | null): string {
    return JSON.stringify(
      elementsOf(glyph).map((element) => {
        const style: Record<string, unknown> = StyleSheet.flatten(element.props.style);

        return [
          element.type,
          Object.entries(style).filter(([property]) => !COLOR_PROPERTIES.includes(property)),
        ];
      }),
    );
  }

  function paintOf(element: ReactTestRendererJSON): unknown {
    const style = StyleSheet.flatten(element.props.style);

    return element.props.tintColor ?? style.backgroundColor ?? style.borderColor;
  }

  it.each(IDENTITIES)("should draw every element %s is made of, and no other", async (identity) => {
    await render(<TabGlyph color={GLYPH_COLOR} identity={identity} />);

    expect(elementsOf(renderedGlyph())).toHaveLength(ELEMENT_COUNTS[identity]);
  });

  it("should draw a silhouette nothing else draws, with the labels and the colors stripped", async () => {
    await render(
      <View>
        {IDENTITIES.map((identity) => (
          <TabGlyph color={GLYPH_COLOR} identity={identity} key={identity} />
        ))}
      </View>,
    );

    const silhouettes = elementsOf(renderedGlyph()).map(silhouetteOf);

    expect(silhouettes).toHaveLength(IDENTITIES.length);
    expect(new Set(silhouettes).size).toBe(IDENTITIES.length);
  });

  it.each(IDENTITIES)(
    "should paint every element of %s with the one color it was given",
    async (identity) => {
      await render(<TabGlyph color={GLYPH_COLOR} identity={identity} />);

      const painted = elementsOf(renderedGlyph()).map(paintOf);

      expect(painted).toHaveLength(ELEMENT_COUNTS[identity]);
      expect(new Set(painted)).toEqual(new Set([GLYPH_COLOR]));
    },
  );

  it("should keep the notched foot the bookmark symbol draws rather than a box of its own", () => {
    expect(tabGlyphDrawing("saved")).toEqual({ type: "bookmark" });
  });

  it("should close the last line of the rules page short, which is what reads as a paragraph end", () => {
    const drawing = tabGlyphDrawing("rules");

    if (drawing.type !== "elements") throw new Error("the rules tab draws a list of elements");

    expect(drawing.elements.map((element) => element.width)).toEqual([14, 8, 8, 5]);
  });

  it("should say nothing of itself, because the tab's own label carries the name", async () => {
    await render(<TabGlyph color={GLYPH_COLOR} identity="cards" />);

    expect(renderedProps().props.accessibilityElementsHidden).toBe(true);
    expect(renderedProps().props.importantForAccessibility).toBe("no-hide-descendants");
  });
});

describe("TabShapeGlyph", () => {
  const SHAPES: readonly TabShape[] = ["square", "diamond", "circle", "pill"];

  it("should draw a box of its own for every shape it offers", async () => {
    await render(
      <View>
        {SHAPES.map((shape) => (
          <TabShapeGlyph color="#0B72E7" key={shape} shape={shape} />
        ))}
      </View>,
    );

    const drawn = elementsOf(renderedGlyph()).map((shape) =>
      JSON.stringify(StyleSheet.flatten(shape.props.style)),
    );

    expect(drawn).toHaveLength(SHAPES.length);
    expect(new Set(drawn).size).toBe(SHAPES.length);
  });

  it("should take the color it was given rather than carry one per shape", async () => {
    await render(<TabShapeGlyph color="#0B72E7" shape="pill" />);

    expect(renderedStyle().backgroundColor).toBe("#0B72E7");
    expect(renderedProps().props.accessibilityElementsHidden).toBe(true);
  });
});
