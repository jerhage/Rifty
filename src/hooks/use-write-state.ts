import { useMutation, type DefaultError, type UseMutationOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import { match } from "ts-pattern";

type WriteState<Result> =
  | { readonly type: "idle" }
  | { readonly type: "saving" }
  | { readonly type: "failed"; readonly error: unknown }
  | Result;

interface WriteStateHandle<Result, Variables> {
  readonly state: WriteState<Result>;
  reset(): void;
  submit(variables: Variables): void;
}

const IDLE = { type: "idle" } as const;
const SAVING = { type: "saving" } as const;

function useWriteState<Result extends { readonly type: string }, Variables>(
  options: UseMutationOptions<Result, DefaultError, Variables>,
): WriteStateHandle<Result, Variables> {
  const mutation = useMutation(options);
  const { mutate, reset: resetMutation } = mutation;

  const submit = useCallback(
    (variables: Variables) => {
      mutate(variables);
    },
    [mutate],
  );

  const reset = useCallback(() => {
    resetMutation();
  }, [resetMutation]);

  const state: WriteState<Result> = match(mutation)
    .with({ status: "idle" }, () => IDLE)
    .with({ status: "pending" }, () => SAVING)
    .with({ status: "error" }, ({ error }): WriteState<Result> => ({ type: "failed", error }))
    .with({ status: "success" }, ({ data }) => data)
    .exhaustive();

  return { reset, state, submit };
}

export { useWriteState };
export type { WriteState, WriteStateHandle };
