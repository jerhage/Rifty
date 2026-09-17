import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";

import type { SaveFooterMessage } from "../../deck-save-format";

function BuildSaveMessage({ message }: { readonly message: SaveFooterMessage }) {
  return match(message)
    .with({ type: "failure" }, (failure) => (
      <ThemedText
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        numberOfLines={2}
        themeColor="negative"
        type="body"
      >
        {failure.message}
      </ThemedText>
    ))
    .with({ type: "readiness" }, (readiness) => (
      <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
        {readiness.message}
      </ThemedText>
    ))
    .exhaustive();
}

export { BuildSaveMessage };
