import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { CardSort } from "@/features/card/card-list-criteria";
import { useTheme } from "@/hooks/use-theme";

import {
  sortDirectionArrow,
  sortDirectionOf,
  sortOptionFor,
  sortOptionLabel,
} from "../card-sort-options";

const FACE_HEIGHT = 30;
const ARROW_WIDTH = 28;
const OUTWARD_SLOP = TouchTarget.slop(FACE_HEIGHT);
const LABEL_SLOP = { bottom: OUTWARD_SLOP, top: OUTWARD_SLOP };
const ARROW_SLOP = {
  bottom: OUTWARD_SLOP,
  right: TouchTarget.minimum - ARROW_WIDTH,
  top: OUTWARD_SLOP,
};

/**
 * Two targets in one shell: the label opens the sort sheet, while the arrow reverses the order in
 * place. Catalog order has no direction, so it shows no arrow.
 */
function CardSortControl({
  onOpenSort,
  onToggleDirection,
  sort,
}: {
  readonly onOpenSort: () => void;
  readonly onToggleDirection: () => void;
  readonly sort: CardSort;
}) {
  const theme = useTheme();
  const arrow = sortDirectionArrow(sort);
  const option = sortOptionFor(sort);
  const isDescending = sortDirectionOf(sort) === "descending";

  return (
    <View style={[styles.control, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      <Pressable
        accessibilityLabel={`Sort by ${sortOptionLabel(sort)}. Change ordering`}
        accessibilityRole="button"
        hitSlop={LABEL_SLOP}
        onPress={onOpenSort}
        style={({ pressed }) => [styles.label, pressed && styles.pressed]}
      >
        <ThemedText themeColor="accent" type="mono">
          {sortOptionLabel(sort)}
        </ThemedText>
      </Pressable>
      {arrow !== null && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityLabel={
              isDescending
                ? `Sorted ${option.descendingLabel}. Switch to ${option.ascendingLabel}`
                : `Sorted ${option.ascendingLabel}. Switch to ${option.descendingLabel}`
            }
            accessibilityRole="button"
            hitSlop={ARROW_SLOP}
            onPress={onToggleDirection}
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <ThemedText themeColor="accent" type="monoValue">
              {arrow}
            </ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );
}

export { CardSortControl };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: FACE_HEIGHT,
  },
  label: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    minWidth: TouchTarget.minimum,
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: Spacing.one + 2,
  },
  arrow: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    paddingVertical: Spacing.one + 2,
    width: ARROW_WIDTH,
  },
  divider: {
    alignSelf: "stretch",
    width: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
});
