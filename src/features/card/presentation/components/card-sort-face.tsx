import { StyleSheet, View } from "react-native";

import { RadioRow } from "@/components/ui/atoms/radio-row";
import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { SheetFace } from "@/components/ui/atoms/sheet-face";
import { Spacing } from "@/constants/theme";
import type { CardSort } from "@/features/card/card-list-criteria";

import {
  CARD_SORT_OPTIONS,
  sortDirectionOf,
  sortForId,
  sortOptionFor,
  sortWithDirection,
} from "../card-sort-options";

/**
 * Attribute and direction are chosen separately, so each ordering appears once. The order control
 * is absent for catalog order, the one ordering with no direction to give.
 */
function CardSortFace({
  onApply,
  onChangeSort,
  sort,
}: {
  readonly onApply: () => void;
  readonly onChangeSort: (sort: CardSort) => void;
  readonly sort: CardSort;
}) {
  const selectedId = sort.type;
  const direction = sortDirectionOf(sort);
  const option = sortOptionFor(sort);

  return (
    <SheetFace
      body={
        <>
          <View style={styles.options}>
            {CARD_SORT_OPTIONS.map(({ id, label, note }) => (
              <RadioRow
                key={id}
                label={label}
                note={note}
                onPress={() => onChangeSort(sortForId(id))}
                selected={selectedId === id}
              />
            ))}
          </View>

          {direction === null ? null : (
            <LabelledSection label="Order">
              <SegmentedControl>
                <SegmentedOption
                  content={{ glyph: "↓", label: option.descendingLabel, type: "glyphLabel" }}
                  onPress={() => onChangeSort(sortWithDirection(sort, "descending"))}
                  role="radio"
                  selected={direction === "descending"}
                />
                <SegmentedOption
                  content={{ glyph: "↑", label: option.ascendingLabel, type: "glyphLabel" }}
                  onPress={() => onChangeSort(sortWithDirection(sort, "ascending"))}
                  role="radio"
                  selected={direction === "ascending"}
                />
              </SegmentedControl>
            </LabelledSection>
          )}
        </>
      }
      confirmLabel="Done"
      onConfirm={onApply}
      title="Sort by"
    />
  );
}

export { CardSortFace };

const styles = StyleSheet.create({
  options: {
    gap: Spacing.half,
  },
});
