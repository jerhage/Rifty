import { Pressable, StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { SelectableChipRow } from "@/components/ui/atoms/selectable-chip-row";
import { SheetFace } from "@/components/ui/atoms/sheet-face";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Keyword } from "@/features/card/keyword/keyword";
import { ORDERED_DOMAINS, type CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { useDomainColors, useKeywordColor } from "@/hooks/use-theme";

import {
  allowsTypeChoice,
  zoneCardTypes,
  zoneRuleSummary,
  type ZonePoolFilters,
} from "../../deck-zone-pool";

function PoolFilterFace({
  filters,
  keywords,
  onApply,
  onReset,
  onToggleDomain,
  onToggleKeyword,
  onToggleType,
  zone,
}: {
  readonly filters: ZonePoolFilters;
  readonly keywords: readonly Keyword[];
  readonly onApply: () => void;
  readonly onReset: () => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleKeyword: (keywordId: string) => void;
  readonly onToggleType: (typeId: CardType) => void;
  readonly zone: DeckSection;
}) {
  const keywordColor = useKeywordColor();
  const domainColors = useDomainColors();

  return (
    <SheetFace
      action={
        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ThemedText themeColor="accent" type="mono">
            Reset
          </ThemedText>
        </Pressable>
      }
      body={
        <>
          <LabelledSection label="Domain">
            <View style={styles.chips}>
              {ORDERED_DOMAINS.map((domainId) => (
                <Chip
                  adornment={<ColorDot color={domainColors[domainId]} />}
                  key={domainId}
                  label={domainId}
                  onPress={() => onToggleDomain(domainId)}
                  selected={filters.domainIds.includes(domainId)}
                  tone="neutral"
                />
              ))}
            </View>
          </LabelledSection>

          {allowsTypeChoice(zone) ? (
            <LabelledSection label="Card type">
              <View style={styles.chips}>
                {zoneCardTypes(zone).map((typeId) => (
                  <Chip
                    key={typeId}
                    label={typeId}
                    onPress={() => onToggleType(typeId)}
                    selected={filters.typeIds.includes(typeId)}
                  />
                ))}
              </View>
            </LabelledSection>
          ) : null}

          <LabelledSection label="Keywords">
            <SelectableChipRow
              items={keywords.map((keyword) => ({
                ...keyword,
                color: keywordColor(keyword.id),
              }))}
              onToggle={onToggleKeyword}
              selectedIds={filters.keywordIds}
            />
          </LabelledSection>

          <ThemedText themeColor="textTertiary" type="body">
            {zoneRuleSummary(zone)}
          </ThemedText>
        </>
      }
      confirmLabel="Show results"
      onConfirm={onApply}
      title="Narrow the pool"
    />
  );
}

export { PoolFilterFace };

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
