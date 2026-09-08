import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { CardSummaryLister } from "@/features/catalog/card/card-summary-lister";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import { Page } from "@/shared/page";

const PAGE_SIZE = 30;

interface CardSummariesDataContent {
  readonly cards: readonly CardSummary[];
  readonly hasMore: boolean;
  readonly isRefreshing: boolean;
  readonly isLoadingMore: boolean;
  readonly loadMoreError: string | null;
  loadMore(): void;
  refresh(): void;
  retryLoadMore(): void;
}

interface CardSummariesDataProps {
  readonly cardSummaryLister: CardSummaryLister;
  readonly children: (content: CardSummariesDataContent) => ReactNode;
}

type CardSummariesDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | {
      readonly type: "success";
      readonly page: Page<CardSummary>;
      readonly isLoadingMore: boolean;
      readonly loadMoreError: string | null;
    };

function CardSummariesData({ cardSummaryLister, children }: CardSummariesDataProps) {
  const [state, setState] = useState<CardSummariesDataState>({ type: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firstPageController = useRef<AbortController | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  const fetchFirstPage = useCallback(() => {
    firstPageController.current?.abort();
    loadMoreController.current?.abort();
    isLoadingMoreRef.current = false;
    const controller = new AbortController();
    firstPageController.current = controller;

    return {
      controller,
      request: cardSummaryLister.getSummaryPage(
        { limit: PAGE_SIZE, offset: 0 },
        { signal: controller.signal },
      ),
    };
  }, [cardSummaryLister]);

  const setLoadedFirstPage = useCallback((page: Page<CardSummary>) => {
    setState({
      type: "success",
      page,
      isLoadingMore: false,
      loadMoreError: null,
    });
  }, []);

  const retryFirstPage = useCallback(() => {
    setState({ type: "loading" });
    const { controller, request } = fetchFirstPage();
    void request
      .then((page) => {
        if (!controller.signal.aborted) setLoadedFirstPage(page);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });
  }, [fetchFirstPage, setLoadedFirstPage]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    const { controller, request } = fetchFirstPage();
    void request
      .then((page) => {
        if (!controller.signal.aborted) setLoadedFirstPage(page);
      })
      .catch(() => {
        // Keep the currently displayed page available when a refresh fails.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRefreshing(false);
      });
  }, [fetchFirstPage, setLoadedFirstPage]);

  useEffect(() => {
    const { controller, request } = fetchFirstPage();
    void request
      .then((page) => {
        if (!controller.signal.aborted) setLoadedFirstPage(page);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => {
      controller.abort();
    };
  }, [fetchFirstPage, setLoadedFirstPage]);

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
      .with({ type: "success", isLoadingMore: false, page: { hasMore: true } }, (loadedState) => {
        const offset = loadedState.page.items.length;
        loadMoreController.current?.abort();
        const controller = new AbortController();
        loadMoreController.current = controller;
        isLoadingMoreRef.current = true;
        setState({ ...loadedState, isLoadingMore: true, loadMoreError: null });
        void cardSummaryLister
          .getSummaryPage({ limit: PAGE_SIZE, offset }, { signal: controller.signal })
          .then((page) => {
            if (controller.signal.aborted) return;
            setState((current) =>
              match(current)
                .with({ type: "success" }, (successfulState) => ({
                  type: "success" as const,
                  page: successfulState.page.append(page),
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
                .with({ type: "success" }, (successfulState) => ({
                  ...successfulState,
                  isLoadingMore: false,
                  loadMoreError: "Could not load more cards.",
                }))
                .otherwise(() => current),
            );
            isLoadingMoreRef.current = false;
          });
      })
      .otherwise(() => undefined);
  }, [cardSummaryLister, state]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load cards.</ThemedText>
        <Pressable onPress={retryFirstPage} style={styles.retryButton}>
          <ThemedText type="linkPrimary">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    ))
    .with({ type: "success" }, (loadedState) =>
      children({
        cards: loadedState.page.items,
        hasMore: loadedState.page.hasMore,
        isRefreshing,
        isLoadingMore: loadedState.isLoadingMore,
        loadMoreError: loadedState.loadMoreError,
        loadMore,
        refresh,
        retryLoadMore: loadMore,
      }),
    )
    .exhaustive();
}

export { CardSummariesData };
export type { CardSummariesDataContent, CardSummariesDataProps };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.two,
    justifyContent: "center",
  },
  retryButton: {
    padding: Spacing.two,
  },
});
