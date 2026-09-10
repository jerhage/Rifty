import { FlatList, StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { HorizontalScroller } from "@/components/ui/atoms/horizontal-scroller";
import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { ORDERED_DOMAINS, type CardDomain } from "@/features/card/value-objects/card-domain";
import { useDomainColors } from "@/hooks/use-theme";

import type { DeckBuildStep } from "../../../deck-build-steps";
import { BuildFooter } from "../build-footer";
import { LegendPickTile } from "../legend-pick-tile";
import { StepIntro } from "./step-intro";

interface LegendStepProps {
  readonly legends: readonly Card[];
  readonly onChangeQuery: (query: string) => void;
  readonly onLoadMore: () => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly query: string;
  readonly selected: Card | null;
  readonly selectedDomainIds: readonly CardDomain[];
  readonly step: DeckBuildStep;
}

function LegendStep({
  legends,
  onChangeQuery,
  onLoadMore,
  onNext,
  onOpenCard,
  onPick,
  onToggleDomain,
  query,
  selected,
  selectedDomainIds,
  step,
}: LegendStepProps) {
  const domainColors = useDomainColors();
  return (
    <>
      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        data={legends}
        keyExtractor={(card) => card.printingId}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <StepIntro step={step} />
            <SearchField
              hint="Search legends"
              onChangeQuery={onChangeQuery}
              query={query}
              style={styles.search}
            />
            <HorizontalScroller style={styles.domains}>
              {ORDERED_DOMAINS.map((domainId) => (
                <Chip
                  adornment={<ColorDot color={domainColors[domainId]} />}
                  key={domainId}
                  label={domainId}
                  labelType="body"
                  onPress={() => onToggleDomain(domainId)}
                  selected={selectedDomainIds.includes(domainId)}
                  tone="neutral"
                />
              ))}
            </HorizontalScroller>
          </View>
        }
        numColumns={2}
        renderItem={({ item }) => (
          <LegendPickTile
            card={item}
            onOpenCard={onOpenCard}
            onPick={onPick}
            selected={selected?.printingId === item.printingId}
          />
        )}
        style={styles.list}
      />
      <BuildFooter actionLabel="Continue" onAction={onNext}>
        <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
          {selected ? selected.name : "No Legend yet — you can skip"}
        </ThemedText>
      </BuildFooter>
    </>
  );
}

export { LegendStep };
export type { LegendStepProps };

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.four,
    width: "100%",
  },
  header: {
    paddingHorizontal: Spacing.three,
  },
  search: {
    marginBottom: Spacing.two + 1,
  },
  domains: {
    marginBottom: Spacing.three - 4,
  },
  row: {
    gap: Spacing.three - 5,
    marginBottom: Spacing.three - 5,
    paddingHorizontal: Spacing.three,
  },
});
