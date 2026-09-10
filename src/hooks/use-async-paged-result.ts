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

interface AsyncPagedResultOptions<T> {
  readonly deps: readonly unknown[];
  readonly loadMoreErrorMessage: string;
  readonly pageSize: number;
  run(request: PageRequest, options: ReadOptions): Promise<PagedRead<T>>;
}

interface AsyncPagedResult<T> {
  readonly state: AsyncPagedResultState<T>;
  loadMore(): void;
  refresh(): void;
  reload(): void;
}

const IDLE_PAGING: PagingState = { type: "idle" };

function useAsyncPagedResult<T>({
  deps,
  loadMoreErrorMessage,
  pageSize,
  run,
}: AsyncPagedResultOptions<T>): AsyncPagedResult<T> {
  const [state, setState] = useState<AsyncPagedResultState<T>>({ type: "loading" });
  const [reloadToken, setReloadToken] = useState(0);
  const runRef = useRef(run);
  const pageSizeRef = useRef(pageSize);
  const loadMoreErrorRef = useRef(loadMoreErrorMessage);
  const firstPageController = useRef<AbortController | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);

  useEffect(() => {
    runRef.current = run;
    pageSizeRef.current = pageSize;
    loadMoreErrorRef.current = loadMoreErrorMessage;
  });

  const startFirstPage = useCallback(() => {
    firstPageController.current?.abort();
    loadMoreController.current?.abort();
    const controller = new AbortController();
    firstPageController.current = controller;

    return {
      controller,
      request: runRef.current(
        { limit: pageSizeRef.current, offset: 0 },
        { signal: controller.signal },
      ),
    };
  }, []);

  useEffect(() => {
    setState({ type: "loading" });
    const { controller, request } = startFirstPage();

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
  }, [...deps, reloadToken, startFirstPage]);

  useEffect(
    () => () => {
      firstPageController.current?.abort();
      loadMoreController.current?.abort();
    },
    [],
  );

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const refresh = useCallback(() => {
    const { controller, request } = startFirstPage();

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
  }, [startFirstPage]);

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

        void runRef
          .current(
            { limit: pageSizeRef.current, offset: loadedCount },
            { signal: controller.signal },
          )
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
                      paging: { type: "failed" as const, message: loadMoreErrorRef.current },
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
  }, [paging, loadedCount]);

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
export type { AsyncPagedResultState, PagingState };
