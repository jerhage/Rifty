import { useCallback, useEffect, useRef, useState } from "react";
import { P, match } from "ts-pattern";

import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

interface PageRequest {
  readonly limit: number;
  readonly offset: number;
}

type PagedRead<T> =
  | { readonly type: "success"; readonly page: Page<T>; readonly total: number }
  | { readonly type: "listFailed" };

type PagedRun<T> = (request: PageRequest, options: ReadOptions) => Promise<PagedRead<T>>;

type PagingState =
  | { readonly type: "idle" }
  | { readonly type: "loadingMore" }
  | { readonly type: "failed"; readonly message: string };

type AsyncPagedResultState<T> =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | {
      readonly type: "success";
      readonly page: Page<T>;
      readonly total: number;
      readonly isRefreshing: boolean;
      readonly paging: PagingState;
    };

interface PagedQuery<T> {
  readonly attempt: number;
  readonly pageSize: number;
  readonly run: PagedRun<T>;
}

interface AsyncPagedResultOptions<T> {
  readonly loadMoreErrorMessage: string;
  readonly pageSize: number;
  readonly run: PagedRun<T>;
}

interface AsyncPagedResult<T> {
  readonly state: AsyncPagedResultState<T>;
  loadMore(): void;
  refresh(): void;
  reload(): void;
}

const IDLE_PAGING: PagingState = { type: "idle" };
const LOADING = { type: "loading" } as const;

function useAsyncPagedResult<T>({
  loadMoreErrorMessage,
  pageSize,
  run,
}: AsyncPagedResultOptions<T>): AsyncPagedResult<T> {
  const [state, setState] = useState<AsyncPagedResultState<T>>(LOADING);
  const [query, setQuery] = useState<PagedQuery<T>>({ attempt: 0, pageSize, run });
  const firstPageController = useRef<AbortController | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);

  if (query.pageSize !== pageSize || query.run !== run) {
    setQuery({ attempt: query.attempt, pageSize, run });
    setState(LOADING);
  }

  const startFirstPage = useCallback((pagedQuery: PagedQuery<T>) => {
    firstPageController.current?.abort();
    loadMoreController.current?.abort();
    const controller = new AbortController();
    firstPageController.current = controller;

    return {
      controller,
      request: pagedQuery.run(
        { limit: pagedQuery.pageSize, offset: 0 },
        { signal: controller.signal },
      ),
    };
  }, []);

  useEffect(() => {
    const { controller, request } = startFirstPage(query);

    void request.then((read) => {
      if (controller.signal.aborted) return;
      setState(
        match(read)
          .with({ type: "success" }, ({ page, total }) => ({
            type: "success" as const,
            page,
            total,
            isRefreshing: false,
            paging: IDLE_PAGING,
          }))
          .with({ type: "listFailed" }, () => ({ type: "loadFailed" }) as const)
          .exhaustive(),
      );
    });

    return () => controller.abort();
  }, [query, startFirstPage]);

  useEffect(
    () => () => {
      firstPageController.current?.abort();
      loadMoreController.current?.abort();
    },
    [],
  );

  const reload = useCallback(() => {
    setState(LOADING);
    setQuery((current) => ({ ...current, attempt: current.attempt + 1 }));
  }, []);

  const refresh = useCallback(() => {
    const { controller, request } = startFirstPage(query);

    setState((current) =>
      match(current)
        .with({ type: "success" }, (successful) => ({ ...successful, isRefreshing: true }))
        .with({ type: "loading" }, { type: "loadFailed" }, () => current)
        .exhaustive(),
    );

    void request.then((read) => {
      if (controller.signal.aborted) return;
      match(read)
        .with({ type: "success" }, ({ page, total }) =>
          setState({
            type: "success",
            page,
            total,
            isRefreshing: false,
            paging: IDLE_PAGING,
          }),
        )
        .with({ type: "listFailed" }, () =>
          setState((current) =>
            match(current)
              .with({ type: "success" }, (successful) => ({ ...successful, isRefreshing: false }))
              .with({ type: "loading" }, { type: "loadFailed" }, () => current)
              .exhaustive(),
          ),
        )
        .exhaustive();
    });
  }, [query, startFirstPage]);

  const paging = match(state)
    .with({ type: "success" }, (successful) => successful.paging)
    .with({ type: "loading" }, { type: "loadFailed" }, () => IDLE_PAGING)
    .exhaustive();
  const loadedCount = match(state)
    .with({ type: "success" }, (successful) => successful.page.items.length)
    .with({ type: "loading" }, { type: "loadFailed" }, () => 0)
    .exhaustive();

  useEffect(() => {
    match(paging)
      .with({ type: "loadingMore" }, () => {
        loadMoreController.current?.abort();
        const controller = new AbortController();
        loadMoreController.current = controller;

        void query
          .run({ limit: query.pageSize, offset: loadedCount }, { signal: controller.signal })
          .then((read) => {
            if (controller.signal.aborted) return;
            setState((current) =>
              match(current)
                .with({ type: "success" }, (successful) =>
                  match(read)
                    .with({ type: "success" }, ({ page, total }) => ({
                      ...successful,
                      page: successful.page.append(page),
                      total,
                      paging: IDLE_PAGING,
                    }))
                    .with({ type: "listFailed" }, () => ({
                      ...successful,
                      paging: { type: "failed" as const, message: loadMoreErrorMessage },
                    }))
                    .exhaustive(),
                )
                .with({ type: "loading" }, { type: "loadFailed" }, () => current)
                .exhaustive(),
            );
          });
      })
      .with({ type: "idle" }, { type: "failed" }, () => undefined)
      .exhaustive();
  }, [loadMoreErrorMessage, loadedCount, paging, query]);

  const loadMore = useCallback(() => {
    setState((current) =>
      match(current)
        .with(
          {
            type: "success",
            paging: { type: P.union("idle", "failed") },
            page: { hasMore: true },
          },
          (loaded) => ({ ...loaded, paging: { type: "loadingMore" as const } }),
        )
        .with({ type: "loading" }, { type: "loadFailed" }, { type: "success" }, () => current)
        .exhaustive(),
    );
  }, []);

  return { state, loadMore, refresh, reload };
}

export { useAsyncPagedResult };
export type { PagedRun, PagingState };
