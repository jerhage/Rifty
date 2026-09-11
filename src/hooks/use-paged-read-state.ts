import {
  useInfiniteQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { match } from "ts-pattern";

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
  { loadMoreErrorMessage }: PagedReadStateOptions,
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

  const loadMore = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage]);

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
    total: data.pages.at(-1)?.total ?? 0,
  };
}

export { usePagedReadState };
export type { PagedReadState, PagedReadStateHandle, PagedResult, PagingState };
