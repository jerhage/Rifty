import {
  useInfiniteQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { match } from "ts-pattern";

import { useAnnouncement, type AnnouncementUrgency } from "@/hooks/use-announcement";
import type { Page } from "@/shared/page";

type PagingState =
  | { readonly type: "idle" }
  | { readonly type: "loadingMore" }
  | { readonly type: "failed"; readonly message: string };

interface PagedResult<Item> {
  readonly type: "success";
  readonly page: Page<Item>;
  readonly total: number;
}

type PagedReadState<Item> =
  | { readonly type: "loading" }
  | { readonly type: "failed"; readonly error: unknown }
  | {
      readonly type: "success";
      readonly hasMore: boolean;
      readonly isRefreshing: boolean;
      readonly items: readonly Item[];
      readonly paging: PagingState;
      readonly total: number;
    };

interface PagedReadStateHandle<Item> {
  readonly state: PagedReadState<Item>;
  loadMore(): void;
  refresh(): void;
  reload(): void;
}

interface PagedReadStateOptions {
  readonly loadMoreErrorMessage: string;
  loadedPageMessage(shown: number, total: number): string;
}

interface LoadedFacts {
  readonly hasMore: boolean;
  readonly isRefreshing: boolean;
  readonly paging: PagingState;
}

const IDLE_PAGING: PagingState = { type: "idle" };
const LOADING_MORE: PagingState = { type: "loadingMore" };
const LOADING = { type: "loading" } as const;

function usePagedReadState<Item, Key extends QueryKey, PageParam>(
  options: UseInfiniteQueryOptions<
    PagedResult<Item>,
    DefaultError,
    InfiniteData<PagedResult<Item>>,
    Key,
    PageParam
  >,
  { loadMoreErrorMessage, loadedPageMessage }: PagedReadStateOptions,
): PagedReadStateHandle<Item> {
  const query = useInfiniteQuery(options);
  const {
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = query;
  const announce = useAnnouncement();
  const spoken = useRef("");

  const announceOnce = useCallback(
    (message: string, urgency: AnnouncementUrgency) => {
      if (message === spoken.current) return;
      spoken.current = message;
      announce(message, urgency);
    },
    [announce],
  );

  const loadMore = useCallback(() => {
    if (!hasNextPage) return;

    void fetchNextPage({ cancelRefetch: false }).then((settled) => {
      if (settled.isFetchNextPageError) {
        announceOnce(loadMoreErrorMessage, "interrupting");
        return;
      }
      if (settled.data === undefined) return;
      announceOnce(loadedPageMessage(itemCount(settled.data), totalOf(settled.data)), "queued");
    });
  }, [announceOnce, fetchNextPage, hasNextPage, loadMoreErrorMessage, loadedPageMessage]);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const facts: LoadedFacts = {
    hasMore: hasNextPage,
    isRefreshing: isFetching && !isFetchingNextPage,
    paging: pagingFor(isFetchingNextPage, isFetchNextPageError, loadMoreErrorMessage),
  };

  const state: PagedReadState<Item> = match(query)
    .with({ status: "pending" }, () => LOADING)
    .with({ status: "error", isLoadingError: true }, ({ error }): PagedReadState<Item> => ({
      type: "failed",
      error,
    }))
    .with(
      { status: "error", isRefetchError: true },
      { status: "error", isFetchNextPageError: true },
      { status: "error", isFetchPreviousPageError: true },
      ({ data }) => loadedState(data, facts),
    )
    .with({ status: "success" }, ({ data }) => loadedState(data, facts))
    .exhaustive();

  return { loadMore, refresh, reload, state };
}

function pagingFor(
  isFetchingNextPage: boolean,
  isFetchNextPageError: boolean,
  loadMoreErrorMessage: string,
): PagingState {
  if (isFetchingNextPage) return LOADING_MORE;
  if (isFetchNextPageError) return { type: "failed", message: loadMoreErrorMessage };
  return IDLE_PAGING;
}

function itemCount<Item>(data: InfiniteData<PagedResult<Item>>): number {
  return data.pages.reduce((running, result) => running + result.page.items.length, 0);
}

function totalOf<Item>(data: InfiniteData<PagedResult<Item>>): number {
  return data.pages.at(-1)?.total ?? 0;
}

function loadedState<Item>(
  data: InfiniteData<PagedResult<Item>>,
  { hasMore, isRefreshing, paging }: LoadedFacts,
): PagedReadState<Item> {
  return {
    type: "success",
    hasMore,
    isRefreshing,
    items: data.pages.flatMap((result) => result.page.items),
    paging,
    total: totalOf(data),
  };
}

export { usePagedReadState };
export type { PagedReadState, PagedReadStateHandle, PagedResult, PagingState };
