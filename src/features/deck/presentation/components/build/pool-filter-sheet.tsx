import { BottomSheet, RNHostView } from "@expo/ui";
import { Pressable, StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { SheetFace } from "@/components/ui/atoms/sheet-face";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Keyword } from "@/features/catalog/keyword/keyword";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import type { CardType } from "@/features/catalog/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { ORDERED_DOMAINS } from "@/features/catalog/presentation/catalog-facet-order";
import { KeywordFilterChips } from "@/features/catalog/presentation/components/sheet/keyword-filter-chips";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import {
  allowsTypeChoice,
  zoneCardTypes,
  zoneRuleSummary,
  type ZonePoolFilters,
} from "../../deck-zone-pool";

function PoolFilterSheet({
  filters,
  isPresented,
  keywords,
  onDismiss,
  onReset,
  onToggleDomain,
  onToggleKeyword,
  onToggleType,
  resultLabel,
  zone,
}: {
  readonly filters: ZonePoolFilters;
  readonly isPresented: boolean;
  readonly keywords: readonly Keyword[];
  readonly onDismiss: () => void;
  readonly onReset: () => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleKeyword: (keywordId: string) => void;
  readonly onToggleType: (typeId: CardType) => void;
  readonly resultLabel: string;
  readonly zone: DeckSection;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();

  return (
    <BottomSheet
      containerColor={theme.backgroundSheet}
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["half", "full"]}
    >
      <RNHostView>
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
                <KeywordFilterChips
                  keywords={keywords}
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
          footerNote={
            <ThemedText themeColor="textSecondary" type="mono" style={styles.result}>
              {resultLabel}
            </ThemedText>
          }
          onConfirm={onDismiss}
          title="Narrow the pool"
        />
      </RNHostView>
    </BottomSheet>
  );
}

export { PoolFilterSheet };

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
  },
  result: {
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
