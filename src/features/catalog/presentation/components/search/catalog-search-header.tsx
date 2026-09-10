import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HorizontalScroller } from "@/components/ui/atoms/horizontal-scroller";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { SearchGlyph } from "@/components/ui/icons/search-glyph";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { ORDERED_DOMAINS, type CardDomain } from "@/features/catalog/value-objects/card-domain";
import { ORDERED_CARD_TYPES, type CardType } from "@/features/catalog/value-objects/card-type";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import type { CatalogQueryCriteria } from "../../catalog-query-criteria";
import { DomainChip } from "./domain-chip";
import { TypeChip } from "./type-chip";

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
      <View style={styles.content}>
        <View
          style={[styles.searchField, { backgroundColor: theme.fill, borderColor: theme.border }]}
        >
          <SearchGlyph color={theme.textSecondary} />
          <TextInput
            accessibilityLabel="Search cards by name or rules text"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onChangeName}
            placeholder="Search cards"
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
            value={name}
          />
          {name.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              onPress={() => onChangeName("")}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedText themeColor="textSecondary" type="mono">
                Clr
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <HorizontalScroller style={styles.domainRow}>
          <DomainChip
            dotColor={theme.textSecondary}
            label="All"
            onPress={onClearDomains}
            selected={selectedDomains.length === 0}
          />
          {ORDERED_DOMAINS.map((domainId) => (
            <DomainChip
              dotColor={domainColors[domainId]}
              key={domainId}
              label={domainId}
              onPress={() => onToggleDomain(domainId)}
              selected={selectedDomains.includes(domainId)}
            />
          ))}
        </HorizontalScroller>

        <HorizontalScroller gap={Spacing.two - 2} style={styles.typeRow}>
          <TypeChip label="All" onPress={onClearTypes} selected={selectedTypes.length === 0} />
          {ORDERED_CARD_TYPES.map((typeId) => (
            <TypeChip
              key={typeId}
              label={typeId}
              onPress={() => onToggleType(typeId)}
              selected={selectedTypes.includes(typeId)}
            />
          ))}
        </HorizontalScroller>
      </View>
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
  content: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  searchField: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    height: 40,
    paddingHorizontal: Spacing.three - 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    minWidth: 0,
    padding: 0,
  },
  domainRow: {
    marginTop: Spacing.three - 5,
  },
  typeRow: {
    marginTop: Spacing.two + 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
