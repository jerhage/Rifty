import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";
import { listKeywords, type ListKeywordsResult } from "@/features/card/use-cases/list-keywords";
import { useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

interface KeywordsDataProps {
  readonly children: (keywords: readonly Keyword[]) => ReactNode;
  readonly keywordLister: KeywordLister;
}

function KeywordsData({ children, keywordLister }: KeywordsDataProps) {
  const { result } = useAsyncResult<ListKeywordsResult>(
    (options: ReadOptions) => listKeywords({ keywordLister }, options),
    [keywordLister],
  );

  return match(result)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "listFailed" }, () => <ErrorState message="Could not load keywords." />)
    .with({ type: "success" }, ({ keywords }) => children(keywords))
    .exhaustive();
}

export { KeywordsData };
