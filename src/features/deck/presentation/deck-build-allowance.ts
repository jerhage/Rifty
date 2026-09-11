import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import {
  limitedCopies,
  narrowerAllowance,
  remainingCopies,
  UNLIMITED_COPIES,
  zoneRule,
  type CopyAllowance,
  type ZoneSection,
} from "@/features/deck/deck/deck-legality";

import { draftComposition, quantityOf, zoneCounts, type DeckBuildDraft } from "./deck-build-steps";

/**
 * The rune deck is the one zone the builder will not let you overfill, because runes are
 * interchangeable filler and going past twelve is never intentional. The other three are built up
 * over time and are allowed to sit off their target, which `verifyDeck` reports rather than
 * prevents. This is a builder affordance, not a rule of the game.
 */
function copiesTheBuilderWillAdd(
  draft: DeckBuildDraft,
  section: ZoneSection,
  card: Card,
): CopyAllowance {
  return match(section)
    .with("runeDeck", (zone) => {
      const freeSlots = zoneRule(zone).requiredCount - slotsHeldByOtherPrintings(draft, zone, card);

      return limitedCopies(freeSlots);
    })
    .with("mainDeck", "battlefield", "sideboard", () => UNLIMITED_COPIES)
    .exhaustive();
}

function remainingForCard(draft: DeckBuildDraft, section: ZoneSection, card: Card): CopyAllowance {
  return narrowerAllowance(
    remainingCopies(draftComposition(draft), section, card.cardId, card.printingId),
    copiesTheBuilderWillAdd(draft, section, card),
  );
}

function slotsHeldByOtherPrintings(
  draft: DeckBuildDraft,
  section: ZoneSection,
  card: Card,
): number {
  return (zoneCounts(draft)[section] ?? 0) - quantityOf(draft, section, card.printingId);
}

/**
 * The deck names one of its main deck cards as the chosen champion, so that printing cannot be
 * taken out from under it.
 */
function minimumForCard(draft: DeckBuildDraft, section: ZoneSection, card: Card): number {
  return match(section)
    .with("mainDeck", () => (draft.chosenChampion?.printingId === card.printingId ? 1 : 0))
    .with("runeDeck", "battlefield", "sideboard", () => 0)
    .exhaustive();
}

export { minimumForCard, remainingForCard };
