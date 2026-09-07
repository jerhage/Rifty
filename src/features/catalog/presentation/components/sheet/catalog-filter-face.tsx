import { Pressable, StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CardSet } from "@/features/catalog/set/card-set";

import { toggleSet, type CatalogQueryCriteria } from "../../catalog-query-criteria";
import { MinimumAttributeInput } from "./minimum-attribute-input";
import { SheetFace } from "./sheet-face";

/**
 * Carries only the facets with nowhere else to go — domains and card types are already chips above
 * the grid, so repeating them here would give the same filter two homes.
 */
function CatalogFilterFace({
  cardSets,
  criteria,
  onApply,
  onChangeCriteria,
  onClear,
}: {
  readonly cardSets: readonly CardSet[];
  readonly criteria: CatalogQueryCriteria;
  readonly onApply: () => void;
  readonly onChangeCriteria: (criteria: CatalogQueryCriteria) => void;
  readonly onClear: () => void;
}) {
  return (
    <SheetFace
      action={
        <Pressable
          accessibilityRole="button"
          onPress={onClear}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ThemedText themeColor="accent" type="mono">
            Reset
          </ThemedText>
        </Pressable>
      }
      body={
        <>
          <LabelledSection label="Sets">
            <View style={styles.chips}>
              {cardSets.map((cardSet) => (
                <Chip
                  key={cardSet.code}
                  label={`${cardSet.name} (${cardSet.code})`}
                  onPress={() => onChangeCriteria(toggleSet(criteria, cardSet.code))}
                  selected={criteria.setCodes?.includes(cardSet.code) ?? false}
                />
              ))}
            </View>
          </LabelledSection>

          <LabelledSection label="Minimum attributes">
            <MinimumAttributeInput
              criteria={criteria}
              label="Energy"
              onChangeCriteria={onChangeCriteria}
              property="energy"
            />
            <MinimumAttributeInput
              criteria={criteria}
              label="Might"
              onChangeCriteria={onChangeCriteria}
              property="might"
            />
            <MinimumAttributeInput
              criteria={criteria}
              label="Power"
              onChangeCriteria={onChangeCriteria}
              property="power"
            />
          </LabelledSection>
        </>
      }
      confirmLabel="Show results"
      onConfirm={onApply}
      title="Advanced filters"
    />
  );
}

export { CatalogFilterFace };

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
