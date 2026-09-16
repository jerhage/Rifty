import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const FACE_HEIGHT = 26;
const OUTWARD_SLOP = TouchTarget.slop(FACE_HEIGHT);
const CONTROL_SLOP = { bottom: OUTWARD_SLOP, top: OUTWARD_SLOP };
const BookmarkedWashAlpha = {
  surface: "14",
  edge: "38",
} as const;

function BookmarkedFilterControl({
  count,
  onPress,
  selected,
}: {
  readonly count: number;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={`Only bookmarked cards, ${count} bookmarked`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      hitSlop={CONTROL_SLOP}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        {
          backgroundColor: selected
            ? theme.accent
            : `${theme.accent}${BookmarkedWashAlpha.surface}`,
          borderColor: selected ? theme.accent : `${theme.accent}${BookmarkedWashAlpha.edge}`,
        },
        pressed && styles.pressed,
      ]}
    >
      <BookmarkGlyph color={selected ? theme.onAccent : theme.accent} filled={selected} />
      <ThemedText themeColor={selected ? "onAccent" : "accent"} type="mono">
        {String(count)}
      </ThemedText>
    </Pressable>
  );
}

export { BookmarkedFilterControl };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two - 3,
    justifyContent: "center",
    minHeight: FACE_HEIGHT,
    minWidth: TouchTarget.minimum,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
