import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { CardId } from "@/features/card/value-objects/card-id";

import {
  deckNameSchema,
  parseDeck,
  type Deck,
  type DeckEntry,
  type DeckId,
  type DeckLegalityRule,
  type DeckLegalityViolation,
  type DeckVerification,
} from "../deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "../deck-legality";
import type { DeckLister } from "../deck-lister";
import type { DeckSaver } from "../deck-saver";

type SaveDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "nameMissing" }
  | { readonly type: "nameTaken" }
  | { readonly type: "copyLimitExceeded"; readonly violations: readonly DeckLegalityViolation[] };

interface DeckDraft {
  readonly id: DeckId;
  readonly name: string;
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
  const parsedName = deckNameSchema.safeParse(draft.name);
  if (!parsedName.success) return { type: "nameMissing" };

  const name = parsedName.data;
  const wanted = name.toLowerCase();
  const existing = await deckLister.getAll();
  if (existing.some((deck) => deck.id !== draft.id && deck.name.trim().toLowerCase() === wanted)) {
    return { type: "nameTaken" };
  }

  const deck = parseDeck({ ...draft, entries: [...draft.entries], name, updatedAt: clock.now() });
  const violations = copyLimitViolations(deck);
  if (violations.length > 0) return { type: "copyLimitExceeded", violations };

  await deckSaver.save(deck);

  return { type: "success", deck };
}

function copyLimitViolations(deck: Deck): readonly DeckLegalityViolation[] {
  const verification = verifyDeck(deck, RIFTBOUND_STANDARD);

  return match<DeckVerification, readonly DeckLegalityViolation[]>(verification)
    .with({ type: "illegal" }, ({ violations }) =>
      violations.filter((violation) => isCopyLimitRule(violation.rule)),
    )
    .with({ type: "legal" }, () => [])
    .exhaustive();
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
