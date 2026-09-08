import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { CardLister } from "@/features/catalog/card/card-lister";
import { Page } from "@/shared/page";

const PAGE_SIZE = 30;

interface CardsDataContent {
  readonly cards: readonly Card[];
  readonly hasMore: boolean;
  readonly isLoadingMore: boolean;
  readonly loadMoreError: string | null;
  readonly total: number;
  loadMore(): void;
}

interface CardsDataProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (content: CardsDataContent) => ReactNode;
  readonly criteria: Omit<CardListCriteria, "limit" | "offset">;
}

type CardsDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | {
      readonly type: "success";
      readonly page: Page<Card>;
      readonly total: number;
      readonly isLoadingMore: boolean;
      readonly loadMoreError: string | null;
    };

function CardsData({ cardCounter, cardLister, children, criteria }: CardsDataProps) {
  const [state, setState] = useState<CardsDataState>({ type: "loading" });
  const firstPageController = useRef<AbortController | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);
  const criteriaKey = JSON.stringify(criteria);

  useEffect(() => {
    firstPageController.current?.abort();
    loadMoreController.current?.abort();
    isLoadingMoreRef.current = false;
    const controller = new AbortController();
    firstPageController.current = controller;
    const matching = JSON.parse(criteriaKey) as CardListCriteria;

    setState({ type: "loading" });
    void Promise.all([
      cardLister.getPage(
        { ...matching, limit: PAGE_SIZE, offset: 0 },
        { signal: controller.signal },
      ),
      cardCounter.count(matching, { signal: controller.signal }),
    ])
      .then(([page, total]) => {
        if (!controller.signal.aborted) {
          setState({ type: "success", page, total, isLoadingMore: false, loadMoreError: null });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => controller.abort();
  }, [cardCounter, cardLister, criteriaKey]);

  useEffect(
    () => () => {
      firstPageController.current?.abort();
      loadMoreController.current?.abort();
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current) return;

    match(state)
      .with({ type: "success", isLoadingMore: false, page: { hasMore: true } }, (loaded) => {
        const offset = loaded.page.items.length;
        loadMoreController.current?.abort();
        const controller = new AbortController();
        loadMoreController.current = controller;
        isLoadingMoreRef.current = true;
        setState({ ...loaded, isLoadingMore: true, loadMoreError: null });

        void cardLister
          .getPage(
            { ...(JSON.parse(criteriaKey) as CardListCriteria), limit: PAGE_SIZE, offset },
            { signal: controller.signal },
          )
          .then((page) => {
            if (controller.signal.aborted) return;
            setState((current) =>
              match(current)
                .with({ type: "success" }, (successful) => ({
                  type: "success" as const,
                  page: successful.page.append(page),
                  total: successful.total,
                  isLoadingMore: false,
                  loadMoreError: null,
                }))
                .otherwise(() => current),
            );
            isLoadingMoreRef.current = false;
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            setState((current) =>
              match(current)
                .with({ type: "success" }, (successful) => ({
                  ...successful,
                  isLoadingMore: false,
                  loadMoreError: "Could not load more cards.",
                }))
                .otherwise(() => current),
            );
            isLoadingMoreRef.current = false;
          });
      })
      .otherwise(() => undefined);
  }, [cardLister, criteriaKey, state]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">Could not load cards.</ThemedText>
        <Button
          label="Try again"
          onPress={() => setState({ type: "loading" })}
          variant="secondary"
        />
      </ThemedView>
    ))
    .with({ type: "success" }, (loaded) =>
      children({
        cards: loaded.page.items,
        hasMore: loaded.page.hasMore,
        isLoadingMore: loaded.isLoadingMore,
        loadMoreError: loaded.loadMoreError,
        total: loaded.total,
        loadMore,
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
