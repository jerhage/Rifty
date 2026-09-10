import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { CardId } from "@/features/card/value-objects/card-id";

import {
  parseDeck,
  type Deck,
  type DeckEntry,
  type DeckId,
  type DeckLegalityRule,
  type DeckLegalityViolation,
  type DeckName,
} from "../deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "../deck-legality";
import type { DeckLister } from "../deck-lister";
import type { DeckSaver } from "../deck-saver";

type SaveDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "nameTaken" }
  | { readonly type: "copyLimitExceeded"; readonly violations: readonly DeckLegalityViolation[] }
  | { readonly type: "saveFailed" };

interface DeckDraft {
  readonly id: DeckId;
  readonly name: DeckName;
  readonly notes: string;
  readonly createdAt: string;
  readonly chosenChampionCardId: CardId | null;
  readonly entries: readonly DeckEntry[];
}

interface SaveDeckCapabilities {
  readonly clock: Clock;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
}

async function saveDeck(
  draft: DeckDraft,
  { clock, deckLister, deckSaver }: SaveDeckCapabilities,
): Promise<SaveDeckResult> {
  try {
    const wanted = draft.name.trim().toLowerCase();
    const existing = await deckLister.getAll();
    if (
      existing.some((deck) => deck.id !== draft.id && deck.name.trim().toLowerCase() === wanted)
    ) {
      return { type: "nameTaken" };
    }

    const deck = parseDeck({ ...draft, entries: [...draft.entries], updatedAt: clock.now() });
    const violations = copyLimitViolations(deck);
    if (violations.length > 0) return { type: "copyLimitExceeded", violations };

    await deckSaver.save(deck);

    return { type: "success", deck };
  } catch {
    return { type: "saveFailed" };
  }
}

function copyLimitViolations(deck: Deck): readonly DeckLegalityViolation[] {
  const verification = verifyDeck(deck, RIFTBOUND_STANDARD);

  return verification.type === "illegal"
    ? verification.violations.filter((violation) => isCopyLimitRule(violation.rule))
    : [];
}

function isCopyLimitRule(rule: DeckLegalityRule): boolean {
  return match(rule)
    .with({ kind: "sectionCopyLimit" }, { kind: "sharedCopyLimit" }, () => true)
    .with(
      { kind: "sectionRequired" },
      { kind: "sectionSize" },
      { kind: "championRequired" },
      { kind: "championInMainDeck" },
      () => false,
    )
    .exhaustive();
}

export { saveDeck };
export type { DeckDraft, SaveDeckCapabilities, SaveDeckResult };
