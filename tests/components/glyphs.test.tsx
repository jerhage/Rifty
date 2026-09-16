import { render, screen } from "@testing-library/react-native";
import type { ReactTestRendererJSON } from "react-test-renderer";
import { StyleSheet, View } from "react-native";

import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { CHEVRON_ARMS, ChevronGlyph } from "@/components/ui/icons/chevron-glyph";
import { TabGlyph, type TabGlyphShape } from "@/components/ui/icons/tab-glyph";

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

/**
 * A shape is what tells one destination from another, so no two may draw the same box, and color
 * says nothing: it is the tint the tab bar hands every glyph.
 */
describe("TabGlyph", () => {
  const SHAPES: readonly TabGlyphShape[] = ["square", "diamond", "circle", "pill"];

  function drawnStyles(): readonly string[] {
    const json = screen.toJSON();
    const node = Array.isArray(json) ? json[0] : json;
    const children: readonly (ReactTestRendererJSON | string)[] = node?.children ?? [];

    return children.map((child) =>
      JSON.stringify(typeof child === "string" ? child : StyleSheet.flatten(child.props.style)),
    );
  }

  it("should draw a box of its own for every shape a destination may take", async () => {
    await render(
      <View>
        {SHAPES.map((shape) => (
          <TabGlyph color="#0B72E7" key={shape} shape={shape} />
        ))}
      </View>,
    );

    const drawn = drawnStyles();

    expect(drawn).toHaveLength(SHAPES.length);
    expect(new Set(drawn).size).toBe(SHAPES.length);
  });

  it("should take the color it was given rather than carry one per shape", async () => {
    await render(<TabGlyph color="#0B72E7" shape="pill" />);

    expect(renderedStyle().backgroundColor).toBe("#0B72E7");
    expect(renderedProps().props.accessibilityElementsHidden).toBe(true);
  });
});
