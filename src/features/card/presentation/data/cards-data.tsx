import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import { listCards } from "@/features/card/use-cases/list-cards";
import { useAsyncPagedResult } from "@/hooks/use-async-paged-result";

const PAGE_SIZE = 30;

interface CardsDataContent {
  readonly cards: readonly Card[];
  readonly hasMore: boolean;
  readonly isRefreshing: boolean;
  readonly isLoadingMore: boolean;
  readonly loadMoreError: string | null;
  readonly total: number;
  loadMore(): void;
  refresh(): void;
}

interface CardsDataProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (content: CardsDataContent) => ReactNode;
  readonly criteria: Omit<CardListCriteria, "limit" | "offset">;
}

function CardsData({ cardCounter, cardLister, children, criteria }: CardsDataProps) {
  const criteriaKey = JSON.stringify(criteria);
  const { state, loadMore, refresh, reload } = useAsyncPagedResult<Card>({
    deps: [cardCounter, cardLister, criteriaKey],
    loadMoreErrorMessage: "Could not load more cards.",
    pageSize: PAGE_SIZE,
    run: ({ limit, offset }, options) =>
      listCards({ ...criteria, limit, offset }, { cardCounter, cardLister }, options),
  });

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">Could not load cards.</ThemedText>
        <Button label="Try again" onPress={reload} variant="secondary" />
      </ThemedView>
    ))
    .with({ type: "success" }, (loaded) =>
      children({
        cards: loaded.page.items,
        hasMore: loaded.page.hasMore,
        isRefreshing: loaded.isRefreshing,
        isLoadingMore: loaded.isLoadingMore,
        loadMoreError: loaded.loadMoreError,
        total: loaded.total,
        loadMore,
        refresh,
      }),
    )
    .exhaustive();
}

export { CardsData };
export type { CardsDataContent };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.three,
    justifyContent: "center",
  },
});
