import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleLister } from "@/features/rules/core-rule-lister";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRulesEditionFinder } from "@/features/rules/core-rules-edition-finder";
import {
  getCoreRulesEditionQuery,
  listCoreRulesQuery,
} from "@/features/rules/queries/core-rules-queries";
import { useReadState } from "@/hooks/use-read-state";

interface CoreRulesDataContent {
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
}

interface CoreRulesDataProps {
  readonly children: (content: CoreRulesDataContent) => ReactNode;
  readonly coreRuleLister: CoreRuleLister;
  readonly coreRulesEditionFinder: CoreRulesEditionFinder;
}

/**
 * The document and the edition that printed it are read together, because the screen's header names
 * the edition and its body is the document. A seeded reference document is present or absent as a
 * whole, so `documentMissing` is an answer about the device rather than a failed read.
 */
function CoreRulesData({ children, coreRuleLister, coreRulesEditionFinder }: CoreRulesDataProps) {
  const documentRead = useReadState(listCoreRulesQuery({ coreRuleLister }));
  const editionRead = useReadState(getCoreRulesEditionQuery({ coreRulesEditionFinder }));

  function reload() {
    documentRead.reload();
    editionRead.reload();
  }

  return match({ document: documentRead.state, edition: editionRead.state })
    .with({ document: { type: "failed" } }, () => <CoreRulesFailure onRetry={reload} />)
    .with({ edition: { type: "failed" } }, () => <CoreRulesFailure onRetry={reload} />)
    .with({ document: { type: "loading" } }, () => <LoadingState />)
    .with({ edition: { type: "loading" } }, () => <LoadingState />)
    .with({ document: { type: "documentMissing" } }, () => <CoreRulesNotOnDevice />)
    .with({ edition: { type: "documentMissing" } }, () => <CoreRulesNotOnDevice />)
    .with(
      { document: { type: "success" }, edition: { type: "success" } },
      ({ document: loaded, edition: found }) =>
        children({ coreRules: loaded.coreRules, edition: found.edition }),
    )
    .exhaustive();
}

function CoreRulesFailure({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <ErrorState
      action={<Button label="Try again" onPress={onRetry} variant="link" />}
      message="Could not load the core rules."
    />
  );
}

function CoreRulesNotOnDevice() {
  return (
    <ThemedView style={styles.pane}>
      <EmptyState message="The core rules are not on this device yet." />
    </ThemedView>
  );
}

export { CoreRulesData };
export type { CoreRulesDataContent, CoreRulesDataProps };

const styles = StyleSheet.create({
  pane: {
    flex: 1,
    justifyContent: "center",
  },
});
