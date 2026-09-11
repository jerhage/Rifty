import {
  useQuery,
  type DefaultError,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { match } from "ts-pattern";

type ReadState<Result> =
  | { readonly type: "loading" }
  | { readonly type: "failed"; readonly error: unknown }
  | Result;

interface ReadStateHandle<Result> {
  readonly state: ReadState<Result>;
  reload(): void;
}

const LOADING = { type: "loading" } as const;

function useReadState<Result extends { readonly type: string }, Key extends QueryKey>(
  options: UseQueryOptions<Result, DefaultError, Result, Key>,
): ReadStateHandle<Result> {
  const query = useQuery(options);
  const { refetch } = query;

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const state: ReadState<Result> = match(query)
    .with({ status: "pending" }, () => LOADING)
    .with({ status: "error", isLoadingError: true }, ({ error }): ReadState<Result> => ({
      type: "failed",
      error,
    }))
    .with({ status: "error", isRefetchError: true }, ({ data }) => data)
    .with({ status: "success" }, ({ data }) => data)
    .exhaustive();

  return { reload, state };
}

export { useReadState };
export type { ReadState, ReadStateHandle };
