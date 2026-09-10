import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";

import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

interface PageRequest {
  readonly limit: number;
  readonly offset: number;
}

type PagedRead<T> =
  | { readonly type: "success"; readonly page: Page<T>; readonly total: number }
  | { readonly type: "listFailed" };

type AsyncPagedResultState<T> =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | {
      readonly type: "success";
      readonly page: Page<T>;
      readonly total: number;
      readonly isRefreshing: boolean;
      readonly isLoadingMore: boolean;
      readonly loadMoreError: string | null;
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
  const stateRef = useRef(state);
  const firstPageController = useRef<AbortController | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    runRef.current = run;
    pageSizeRef.current = pageSize;
    loadMoreErrorRef.current = loadMoreErrorMessage;
    stateRef.current = state;
  });

  const startFirstPage = useCallback(() => {
    firstPageController.current?.abort();
    loadMoreController.current?.abort();
    isLoadingMoreRef.current = false;
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
            isLoadingMore: false,
            loadMoreError: null,
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
        .otherwise(() => current),
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
            isLoadingMore: false,
            loadMoreError: null,
          }),
        )
        .with({ type: "listFailed" }, () =>
          setState((current) =>
            match(current)
              .with({ type: "success" }, (successful) => ({ ...successful, isRefreshing: false }))
              .otherwise(() => current),
          ),
        )
        .exhaustive();
    });
  }, [startFirstPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current) return;

    match(stateRef.current)
      .with({ type: "success", isLoadingMore: false, page: { hasMore: true } }, (loaded) => {
        const offset = loaded.page.items.length;
        loadMoreController.current?.abort();
        const controller = new AbortController();
        loadMoreController.current = controller;
        isLoadingMoreRef.current = true;
        setState({ ...loaded, isLoadingMore: true, loadMoreError: null });

        void runRef
          .current({ limit: pageSizeRef.current, offset }, { signal: controller.signal })
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
                      isLoadingMore: false,
                      loadMoreError: null,
                    }))
                    .with({ type: "listFailed" }, () => ({
                      ...successful,
                      isLoadingMore: false,
                      loadMoreError: loadMoreErrorRef.current,
                    }))
                    .exhaustive(),
                )
                .otherwise(() => current),
            );
            isLoadingMoreRef.current = false;
          });
      })
      .otherwise(() => undefined);
  }, []);

  return { state, loadMore, refresh, reload };
}

export { useAsyncPagedResult };
export type { AsyncPagedResultState };
