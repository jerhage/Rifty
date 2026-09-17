import { StyleSheet, View, type ColorValue, type ViewStyle } from "react-native";
import { match } from "ts-pattern";

import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";

type TabIdentity = "cards" | "decks" | "rules" | "saved";

type TabGlyphPaint = "fill" | "outline";

interface TabGlyphElement {
  readonly height: number;
  readonly key: string;
  readonly left: number;
  readonly opacity: number;
  readonly paint: TabGlyphPaint;
  readonly radius: number;
  readonly rotation: number;
  readonly top: number;
  readonly width: number;
}

type TabGlyphDrawing =
  | { readonly type: "elements"; readonly elements: readonly TabGlyphElement[] }
  | { readonly type: "bookmark" };

const GLYPH_BOX = 18;
const GLYPH_STROKE = 1.6;

const TAB_GLYPH_DRAWINGS_BY_IDENTITY: Readonly<Record<TabIdentity, TabGlyphDrawing>> = {
  cards: {
    type: "elements",
    elements: [
      {
        key: "behind",
        height: 14,
        left: 0.5,
        opacity: 0.45,
        paint: "fill",
        radius: 2.5,
        rotation: -14,
        top: 3,
        width: 10,
      },
      {
        key: "front",
        height: 15,
        left: 6,
        opacity: 1,
        paint: "outline",
        radius: 2.5,
        rotation: 0,
        top: 2,
        width: 11,
      },
    ],
  },
  decks: {
    type: "elements",
    elements: [
      {
        key: "top",
        height: 4,
        left: 0,
        opacity: 1,
        paint: "fill",
        radius: 1.5,
        rotation: 0,
        top: 1,
        width: 18,
      },
      {
        key: "middle",
        height: 4,
        left: 0,
        opacity: 0.6,
        paint: "fill",
        radius: 1.5,
        rotation: 0,
        top: 7,
        width: 18,
      },
      {
        key: "beneath",
        height: 4,
        left: 0,
        opacity: 0.32,
        paint: "fill",
        radius: 1.5,
        rotation: 0,
        top: 13,
        width: 18,
      },
    ],
  },
  rules: {
    type: "elements",
    elements: [
      {
        key: "page",
        height: 18,
        left: 2,
        opacity: 1,
        paint: "outline",
        radius: 2.5,
        rotation: 0,
        top: 0,
        width: 14,
      },
      {
        key: "firstLine",
        height: GLYPH_STROKE,
        left: 5,
        opacity: 1,
        paint: "fill",
        radius: 1,
        rotation: 0,
        top: 4.5,
        width: 8,
      },
      {
        key: "secondLine",
        height: GLYPH_STROKE,
        left: 5,
        opacity: 1,
        paint: "fill",
        radius: 1,
        rotation: 0,
        top: 8.5,
        width: 8,
      },
      {
        key: "closingLine",
        height: GLYPH_STROKE,
        left: 5,
        opacity: 1,
        paint: "fill",
        radius: 1,
        rotation: 0,
        top: 12.5,
        width: 5,
      },
    ],
  },
  saved: { type: "bookmark" },
};

function tabGlyphDrawing(identity: TabIdentity): TabGlyphDrawing {
  return TAB_GLYPH_DRAWINGS_BY_IDENTITY[identity];
}

function TabGlyph({
  color,
  identity,
}: {
  readonly color: ColorValue;
  readonly identity: TabIdentity;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.box}
    >
      {match(tabGlyphDrawing(identity))
        .with({ type: "elements" }, ({ elements }) =>
          elements.map((element) => (
            <TabGlyphPart color={color} element={element} key={element.key} />
          )),
        )
        .with({ type: "bookmark" }, () => <BookmarkGlyph color={color} filled />)
        .exhaustive()}
    </View>
  );
}

function TabGlyphPart({
  color,
  element,
}: {
  readonly color: ColorValue;
  readonly element: TabGlyphElement;
}) {
  return (
    <View
      style={[
        styles.part,
        {
          borderRadius: element.radius,
          height: element.height,
          left: element.left,
          opacity: element.opacity,
          top: element.top,
          transform: [{ rotate: `${element.rotation}deg` }],
          width: element.width,
        },
        paintStyle(element.paint, color),
      ]}
    />
  );
}

function paintStyle(paint: TabGlyphPaint, color: ColorValue): ViewStyle {
  return match(paint)
    .with("fill", () => ({ backgroundColor: color }))
    .with("outline", () => ({ borderColor: color, borderWidth: GLYPH_STROKE }))
    .exhaustive();
}

export { TabGlyph, tabGlyphDrawing };
export type { TabGlyphDrawing, TabGlyphElement, TabIdentity };

const styles = StyleSheet.create({
  box: {
    height: GLYPH_BOX,
    width: GLYPH_BOX,
  },
  part: {
    position: "absolute",
  },
});
