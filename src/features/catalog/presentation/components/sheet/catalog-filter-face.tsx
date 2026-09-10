import { Pressable, StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { SelectableChipRow } from "@/components/ui/atoms/selectable-chip-row";
import { SheetFace } from "@/components/ui/atoms/sheet-face";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { CardSet } from "@/features/set/card-set";
import { useKeywordColor } from "@/hooks/use-theme";

import { toggleKeyword, toggleSet, type CatalogQueryCriteria } from "../../catalog-query-criteria";
import { MinimumAttributeInput } from "./minimum-attribute-input";

/**
 * Carries only the facets with nowhere else to go — domains and card types are already chips above
 * the grid, so repeating them here would give the same filter two homes.
 */
function CatalogFilterFace({
  cardSets,
  criteria,
  keywords,
  onApply,
  onChangeCriteria,
  onClear,
}: {
  readonly cardSets: readonly CardSet[];
  readonly criteria: CatalogQueryCriteria;
  readonly keywords: readonly Keyword[];
  readonly onApply: () => void;
  readonly onChangeCriteria: (criteria: CatalogQueryCriteria) => void;
  readonly onClear: () => void;
}) {
  const keywordColor = useKeywordColor();

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

          <LabelledSection label="Keywords">
            <SelectableChipRow
              items={keywords.map((keyword) => ({ ...keyword, color: keywordColor(keyword.id) }))}
              onToggle={(keywordId) => onChangeCriteria(toggleKeyword(criteria, keywordId))}
              selectedIds={criteria.keywordIds ?? []}
            />
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
