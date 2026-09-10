import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import {
  copyAllowance,
  limitedCopies,
  narrowerAllowance,
  remainingAllowance,
  sectionsSharingAllowance,
  UNLIMITED_COPIES,
  zoneRule,
  type CopyAllowance,
  type ZoneSection,
} from "@/features/deck/deck/deck-legality";

import { copiesOfName, quantityOf, zoneCounts, type DeckBuildDraft } from "./deck-build-steps";

/**
 * Copies of this card already committed somewhere the player cannot change from this zone — the
 * other shared zone, or another printing of the same card.
 */
function lockedCopies(draft: DeckBuildDraft, section: ZoneSection, card: Card): number {
  return copiesOfName(draft, card.cardId, sectionsSharingAllowance(section), {
    section,
    printingId: card.printingId,
  });
}

/**
 * The rune deck is the one zone the builder will not let you overfill. The other three are worked
 * on over time and are allowed to sit above or below their target.
 */
function copiesFittingZone(draft: DeckBuildDraft, section: ZoneSection, card: Card): CopyAllowance {
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
    remainingAllowance(copyAllowance(section), lockedCopies(draft, section, card)),
    copiesFittingZone(draft, section, card),
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

export { lockedCopies, minimumForCard, remainingForCard };
