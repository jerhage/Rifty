import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";
import { listKeywords, type ListKeywordsResult } from "@/features/card/use-cases/list-keywords";
import { type AsyncRun, useAsyncResult } from "@/hooks/use-async-result";

interface KeywordsDataProps {
  readonly children: (keywords: readonly Keyword[]) => ReactNode;
  readonly keywordLister: KeywordLister;
}

function KeywordsData({ children, keywordLister }: KeywordsDataProps) {
  const run = useCallback<AsyncRun<ListKeywordsResult>>(
    (options) => listKeywords({ keywordLister }, options),
    [keywordLister],
  );
  const { result } = useAsyncResult(run);

  return match(result)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "listFailed" }, () => <ErrorState message="Could not load keywords." />)
    .with({ type: "success" }, ({ keywords }) => children(keywords))
    .exhaustive();
}

export { KeywordsData };
