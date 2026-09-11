import { useCallback, useEffect, useState } from "react";

import type { ReadOptions } from "@/shared/read-options";

type AsyncResult<Result> = { readonly type: "loading" } | Result;

type AsyncRun<Result> = (options: ReadOptions) => Promise<Result>;

interface AsyncResultHandle<Result> {
  readonly result: AsyncResult<Result>;
  reload(): void;
}

const LOADING = { type: "loading" } as const;

function useAsyncResult<Result extends { readonly type: string }>(
  run: AsyncRun<Result>,
): AsyncResultHandle<Result> {
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<AsyncResult<Result>>(LOADING);

  useEffect(() => {
    const controller = new AbortController();

    setResult((current) => (current.type === "loading" ? current : LOADING));
    void run({ signal: controller.signal }).then(
      (next) => {
        if (!controller.signal.aborted) setResult(next);
      },
      () => undefined,
    );

    return () => {
      controller.abort();
    };
  }, [reloadToken, run]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { reload, result };
}

export { useAsyncResult };
export type { AsyncResult, AsyncRun };
