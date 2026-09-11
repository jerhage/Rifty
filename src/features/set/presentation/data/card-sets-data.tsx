import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { CardSet } from "@/features/set/card-set";
import type { SetLister } from "@/features/set/set-lister";
import { listSets, type ListSetsResult } from "@/features/set/use-cases/list-sets";
import { type AsyncRun, useAsyncResult } from "@/hooks/use-async-result";

interface CardSetsDataProps {
  readonly children: (cardSets: readonly CardSet[]) => ReactNode;
  readonly setLister: SetLister;
}

function CardSetsData({ children, setLister }: CardSetsDataProps) {
  const run = useCallback<AsyncRun<ListSetsResult>>(
    (options) => listSets({ setLister }, options),
    [setLister],
  );
  const { result } = useAsyncResult(run);

  return match(result)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "listFailed" }, () => <ErrorState message="Could not load card sets." />)
    .with({ type: "success" }, ({ cardSets }) => children(cardSets))
    .exhaustive();
}

export { CardSetsData };
