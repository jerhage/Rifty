import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { CardSet } from "@/features/set/card-set";
import type { SetLister } from "@/features/set/set-lister";
import { listSets, type ListSetsResult } from "@/features/set/use-cases/list-sets";
import { useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

interface CardSetsDataProps {
  readonly children: (cardSets: readonly CardSet[]) => ReactNode;
  readonly setLister: SetLister;
}

function CardSetsData({ children, setLister }: CardSetsDataProps) {
  const { result } = useAsyncResult<ListSetsResult>(
    (options: ReadOptions) => listSets({ setLister }, options),
    [setLister],
  );

  return match(result)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "listFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load card sets.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "success" }, ({ cardSets }) => children(cardSets))
    .exhaustive();
}

export { CardSetsData };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.two,
    justifyContent: "center",
  },
});
