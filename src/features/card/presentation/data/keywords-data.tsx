import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
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
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "listFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load keywords.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "success" }, ({ keywords }) => children(keywords))
    .exhaustive();
}

export { KeywordsData };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.two,
    justifyContent: "center",
  },
});
