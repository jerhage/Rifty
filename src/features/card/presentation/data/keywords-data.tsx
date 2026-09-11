import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";
import { keywordsQuery } from "@/features/card/presentation/queries/card-queries";
import { useReadState } from "@/hooks/use-read-state";

interface KeywordsDataProps {
  readonly children: (keywords: readonly Keyword[]) => ReactNode;
  readonly keywordLister: KeywordLister;
}

function KeywordsData({ children, keywordLister }: KeywordsDataProps) {
  const { state } = useReadState(keywordsQuery({ keywordLister }));

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => <ErrorState message="Could not load keywords." />)
    .with({ type: "success" }, ({ keywords }) => children(keywords))
    .exhaustive();
}

export { KeywordsData };
