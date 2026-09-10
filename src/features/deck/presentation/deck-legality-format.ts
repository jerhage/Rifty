import { match } from "ts-pattern";

import type { Theme } from "@/constants/theme";
import type { DeckVerification } from "@/features/deck/deck/deck";

function legalityColor(verification: DeckVerification, theme: Theme): string {
  return match(verification)
    .with({ type: "legal" }, () => theme.positive)
    .with({ type: "unverified" }, { type: "illegal" }, () => theme.warning)
    .exhaustive();
}

function outstandingFixesLabel(verification: DeckVerification): string {
  return match(verification)
    .with({ type: "legal" }, () => "Legal")
    .with({ type: "unverified" }, () => "Not checked")
    .with({ type: "illegal" }, ({ violations }) => `${violations.length} to fix`)
    .exhaustive();
}

function completenessLabel(verification: DeckVerification): string {
  return match(verification)
    .with({ type: "legal" }, () => "Legal")
    .with({ type: "unverified" }, { type: "illegal" }, () => "Incomplete")
    .exhaustive();
}

function saveReadinessLabel(verification: DeckVerification): string {
  return match(verification)
    .with({ type: "illegal" }, ({ violations }) => `${violations.length} to fix`)
    .with({ type: "legal" }, { type: "unverified" }, () => "Ready to save")
    .exhaustive();
}

export { completenessLabel, legalityColor, outstandingFixesLabel, saveReadinessLabel };
