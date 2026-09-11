import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { CardSet } from "@/features/set/card-set";
import { listCardSetsQuery } from "@/features/set/queries/set-queries";
import type { SetLister } from "@/features/set/set-lister";
import { useReadState } from "@/hooks/use-read-state";

interface CardSetsDataProps {
  readonly children: (cardSets: readonly CardSet[]) => ReactNode;
  readonly setLister: SetLister;
}

function CardSetsData({ children, setLister }: CardSetsDataProps) {
  const { state } = useReadState(listCardSetsQuery({ setLister }));

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => <ErrorState message="Could not load card sets." />)
    .with({ type: "success" }, ({ cardSets }) => children(cardSets))
    .exhaustive();
}

export { CardSetsData };
