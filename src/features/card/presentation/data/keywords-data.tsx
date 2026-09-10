import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";

interface KeywordsDataProps {
  readonly children: (keywords: readonly Keyword[]) => ReactNode;
  readonly keywordLister: KeywordLister;
}

type KeywordsDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly keywords: readonly Keyword[] };

function KeywordsData({ children, keywordLister }: KeywordsDataProps) {
  const [state, setState] = useState<KeywordsDataState>({ type: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void keywordLister
      .getAll({ signal: controller.signal })
      .then((keywords) => {
        if (!controller.signal.aborted) setState({ type: "success", keywords });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => controller.abort();
  }, [keywordLister]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
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
