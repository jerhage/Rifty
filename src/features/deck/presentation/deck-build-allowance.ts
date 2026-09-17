import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";
import {
  limitedCopies,
  narrowerAllowance,
  remainingCopies,
  sectionRule,
  UNLIMITED_COPIES,
  type CopyAllowance,
} from "@/features/deck/deck/deck-legality";

import {
  draftEntries,
  isPickOf,
  quantityOf,
  sectionCounts,
  type DeckBuildDraft,
} from "./deck-build-steps";

/**
 * The rune deck is the one section the builder will not let you overfill, because runes are
 * interchangeable filler and going past twelve is never intentional. The others are built up over
 * time and are allowed to sit off their target, which `verifyDeck` reports rather than prevents.
 * This is a builder affordance, not a rule of the game.
 */
function copiesTheBuilderWillAdd(
  draft: DeckBuildDraft,
  section: DeckSection,
  card: Card,
): CopyAllowance {
  return match(section)
    .with("runeDeck", (runeDeck) => {
      const freeSlots =
        sectionRule(runeDeck).requiredCount - slotsHeldByOtherPrintings(draft, runeDeck, card);

      return limitedCopies(freeSlots);
    })
    .with("legend", "mainDeck", "battlefield", "sideboard", () => UNLIMITED_COPIES)
    .exhaustive();
}

function remainingForCard(draft: DeckBuildDraft, section: DeckSection, card: Card): CopyAllowance {
  return narrowerAllowance(
    remainingCopies(draftEntries(draft), section, card.cardId, card.printingId),
    copiesTheBuilderWillAdd(draft, section, card),
  );
}

function slotsHeldByOtherPrintings(
  draft: DeckBuildDraft,
  section: DeckSection,
  card: Card,
): number {
  return (sectionCounts(draft)[section] ?? 0) - quantityOf(draft, section, card.printingId);
}

/**
 * The deck names one of its main deck cards as the chosen champion, so that printing cannot be
 * taken out from under it.
 */
function minimumForCard(draft: DeckBuildDraft, section: DeckSection, card: Card): number {
  return match(section)
    .with("mainDeck", () => (isPickOf(draft.chosenChampion, card) ? 1 : 0))
    .with("legend", "runeDeck", "battlefield", "sideboard", () => 0)
    .exhaustive();
}

export { minimumForCard, remainingForCard };
