import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import type { CardLister } from "@/features/catalog/card/card-lister";
import { Page } from "@/shared/page";

const PAGE_SIZE = 10;

interface CardsDataContent {
  readonly cards: readonly Card[];
  readonly hasMore: boolean;
  readonly isRefreshing: boolean;
  readonly isLoadingMore: boolean;
  readonly loadMoreError: string | null;
  loadMore(): void;
  refresh(): void;
  retryLoadMore(): void;
}

interface CardsDataProps {
  readonly cardLister: CardLister;
  readonly children: (content: CardsDataContent) => ReactNode;
}

type CardsDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | {
      readonly type: "success";
      readonly page: Page<Card>;
      readonly isLoadingMore: boolean;
      readonly loadMoreError: string | null;
    };

function CardsData({ cardLister, children }: CardsDataProps) {
  const [state, setState] = useState<CardsDataState>({ type: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFirstPage = useCallback(
    () => cardLister.getPage({ limit: PAGE_SIZE, offset: 0 }),
    [cardLister],
  );

  const setLoadedFirstPage = useCallback((page: Page<Card>) => {
    setState({
      type: "success",
      page,
      isLoadingMore: false,
      loadMoreError: null,
    });
  }, []);

  const retryFirstPage = useCallback(() => {
    setState({ type: "loading" });
    void fetchFirstPage()
      .then((page) => {
        setLoadedFirstPage(page);
      })
      .catch(() => setState({ type: "loadFailed" }));
  }, [fetchFirstPage, setLoadedFirstPage]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchFirstPage()
      .then(setLoadedFirstPage)
      .catch(() => {
        // Keep the currently displayed page available when a refresh fails.
      })
      .finally(() => setIsRefreshing(false));
  }, [fetchFirstPage, setLoadedFirstPage]);

  useEffect(() => {
    let isCurrent = true;
    void fetchFirstPage()
      .then((page) => {
        if (isCurrent) setLoadedFirstPage(page);
      })
      .catch(() => {
        if (isCurrent) setState({ type: "loadFailed" });
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchFirstPage, setLoadedFirstPage]);

  const loadMore = useCallback(() => {
    if (state.type !== "success" || state.isLoadingMore || !state.page.hasMore) return;

    const offset = state.page.items.length;
    setState({ ...state, isLoadingMore: true, loadMoreError: null });
    void cardLister
      .getPage({ limit: PAGE_SIZE, offset })
      .then((page) => {
        setState((current) =>
          current.type === "success"
            ? {
                type: "success",
                page: current.page.append(page),
                isLoadingMore: false,
                loadMoreError: null,
              }
            : current,
        );
      })
      .catch(() => {
        setState((current) =>
          current.type === "success"
            ? { ...current, isLoadingMore: false, loadMoreError: "Could not load more cards." }
            : current,
        );
      });
  }, [cardLister, state]);

  if (state.type === "loading") {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (state.type === "loadFailed") {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load cards.</ThemedText>
        <Pressable onPress={retryFirstPage} style={styles.retryButton}>
          <ThemedText type="linkPrimary">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return children({
    cards: state.page.items,
    hasMore: state.page.hasMore,
    isRefreshing,
    isLoadingMore: state.isLoadingMore,
    loadMoreError: state.loadMoreError,
    loadMore,
    refresh,
    retryLoadMore: loadMore,
  });
}

export { CardsData };
export type { CardsDataContent, CardsDataProps };

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
