import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { HorizontalScroller } from "@/components/ui/atoms/horizontal-scroller";
import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import { ORDERED_DOMAINS, type CardDomain } from "@/features/card/value-objects/card-domain";
import { ORDERED_CARD_TYPES, type CardType } from "@/features/card/value-objects/card-type";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import type { CatalogQueryCriteria } from "../../catalog-query-criteria";

/**
 * The search field and quick chips stay pinned above the grid so filtering never requires scrolling
 * back to the top of a long result set.
 */
function CatalogSearchHeader({
  criteria,
  name,
  onChangeName,
  onClearDomains,
  onClearTypes,
  onToggleDomain,
  onToggleType,
}: {
  readonly criteria: CatalogQueryCriteria;
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onClearDomains: () => void;
  readonly onClearTypes: () => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleType: (typeId: CardType) => void;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const domainColors = useDomainColors();
  const selectedDomains = criteria.anyDomainIds ?? [];
  const selectedTypes = criteria.typeIds ?? [];

  return (
    <ThemedView
      style={[
        styles.header,
        {
          borderBottomColor: theme.border,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
          paddingTop: insets.top + Spacing.two,
        },
      ]}
    >
      <SearchField
        accessibilityLabel="Search cards by name or rules text"
        hint="Search cards"
        onChangeQuery={onChangeName}
        query={name}
      />

      <HorizontalScroller style={styles.domainRow}>
        <Chip
          adornment={<ColorDot color={theme.textSecondary} />}
          label="All"
          labelType="body"
          onPress={onClearDomains}
          selected={selectedDomains.length === 0}
          tone="neutral"
        />
        {ORDERED_DOMAINS.map((domainId) => (
          <Chip
            adornment={<ColorDot color={domainColors[domainId]} />}
            key={domainId}
            label={domainId}
            labelType="body"
            onPress={() => onToggleDomain(domainId)}
            selected={selectedDomains.includes(domainId)}
            tone="neutral"
          />
        ))}
      </HorizontalScroller>

      <HorizontalScroller gap={Spacing.two - 2} style={styles.typeRow}>
        <Chip
          label="All"
          labelType="mono"
          onPress={onClearTypes}
          selected={selectedTypes.length === 0}
        />
        {ORDERED_CARD_TYPES.map((typeId) => (
          <Chip
            key={typeId}
            label={typeId}
            labelType="mono"
            onPress={() => onToggleType(typeId)}
            selected={selectedTypes.includes(typeId)}
          />
        ))}
      </HorizontalScroller>
    </ThemedView>
  );
}

export { CatalogSearchHeader };

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.three - 4,
    zIndex: 1,
  },
  domainRow: {
    marginTop: Spacing.three - 5,
  },
  typeRow: {
    marginTop: Spacing.two + 1,
  },
});
