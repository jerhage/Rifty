import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";

import {
  deckNameSchema,
  parseDeck,
  type ChosenChampion,
  type Deck,
  type DeckComposition,
  type DeckEntry,
  type DeckId,
  type DeckLegalityRule,
  type DeckLegalityViolation,
  type DeckVerification,
} from "../deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "../deck-legality";
import type { DeckLister } from "../deck-lister";
import { isDeckNameTaken } from "../deck-naming";
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
  readonly chosenChampion: ChosenChampion | null;
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
  if (isDeckNameTaken(name, await deckLister.getAll(), draft.id)) {
    return { type: "nameTaken" };
  }

  const deck = parseDeck({
    ...draft,
    chosenChampionCardId: draft.chosenChampion?.cardId ?? null,
    entries: [...draft.entries],
    name,
    updatedAt: clock.now(),
  });
  const violations = copyLimitViolations({
    entries: deck.entries,
    chosenChampion: draft.chosenChampion,
  });
  if (violations.length > 0) return { type: "copyLimitExceeded", violations };

  await deckSaver.save(deck);

  return { type: "success", deck };
}

function copyLimitViolations(composition: DeckComposition): readonly DeckLegalityViolation[] {
  const verification = verifyDeck(composition, RIFTBOUND_STANDARD);

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
      { kind: "championIsChampionUnit" },
      () => false,
    )
    .exhaustive();
}

export { saveDeck };
export type { DeckDraft, SaveDeckCapabilities, SaveDeckResult };
