import { type DependencyList, useCallback, useEffect, useRef, useState } from "react";

import type { ReadOptions } from "@/shared/read-options";

type AsyncResult<Result> = { readonly type: "loading" } | Result;

interface AsyncResultHandle<Result> {
  readonly result: AsyncResult<Result>;
  reload(): void;
}

function useAsyncResult<Result extends { readonly type: string }>(
  run: (options: ReadOptions) => Promise<Result>,
  deps: DependencyList,
): AsyncResultHandle<Result> {
  const runRef = useRef(run);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<AsyncResult<Result>>({ type: "loading" });

  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    const controller = new AbortController();

    setResult((current) => (current.type === "loading" ? current : { type: "loading" }));
    void runRef.current({ signal: controller.signal }).then(
      (next) => {
        if (!controller.signal.aborted) setResult(next);
      },
      () => undefined,
    );

    return () => {
      controller.abort();
    };
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { reload, result };
}

export { useAsyncResult };
export type { AsyncResult, AsyncResultHandle };
