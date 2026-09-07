import { StyleSheet, View } from "react-native";

import { RadioRow } from "@/components/ui/atoms/radio-row";
import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { Spacing } from "@/constants/theme";

import type { CatalogQueryCriteria } from "../../catalog-query-criteria";
import {
  sortDirectionOf,
  sortForId,
  sortIdOf,
  sortOptionFor,
  sortOptions,
  sortWithDirection,
} from "../../catalog-sort-options";
import { SheetFace } from "./sheet-face";

/**
 * Attribute and direction are chosen separately, so each ordering appears once. The order control
 * is absent for catalog order, the one ordering with no direction to give.
 */
function CatalogSortFace({
  criteria,
  onApply,
  onChangeCriteria,
}: {
  readonly criteria: CatalogQueryCriteria;
  readonly onApply: () => void;
  readonly onChangeCriteria: (criteria: CatalogQueryCriteria) => void;
}) {
  const selectedId = sortIdOf(criteria.sort);
  const direction = sortDirectionOf(criteria.sort);
  const option = sortOptionFor(criteria.sort);

  return (
    <SheetFace
      body={
        <>
          <View style={styles.options}>
            {sortOptions.map(({ id, label, note }) => (
              <RadioRow
                key={id}
                label={label}
                note={note}
                onPress={() => onChangeCriteria({ ...criteria, sort: sortForId(id) })}
                selected={selectedId === id}
              />
            ))}
          </View>

          {direction === null ? null : (
            <LabelledSection label="Order">
              <SegmentedControl>
                <SegmentedOption
                  glyph="↓"
                  label={option.descendingLabel}
                  onPress={() =>
                    onChangeCriteria({
                      ...criteria,
                      sort: sortWithDirection(criteria.sort, "descending"),
                    })
                  }
                  selected={direction === "descending"}
                />
                <SegmentedOption
                  glyph="↑"
                  label={option.ascendingLabel}
                  onPress={() =>
                    onChangeCriteria({
                      ...criteria,
                      sort: sortWithDirection(criteria.sort, "ascending"),
                    })
                  }
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

export { CatalogSortFace };

const styles = StyleSheet.create({
  options: {
    gap: Spacing.half,
  },
});
