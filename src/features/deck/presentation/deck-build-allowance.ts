import type { Card } from "@/features/catalog/card/card";
import { cardIdentityName } from "@/features/catalog/presentation/card-identity";
import type { DeckSection } from "@/features/deck/deck/deck";
import { copyAllowance, zoneRules } from "@/features/deck/deck/deck-legality";

import { copiesOfName, quantityOf, zoneCounts, type DeckBuildDraft } from "./deck-build-steps";

const sharedSections: readonly DeckSection[] = ["chosenChampion", "mainDeck", "sideboard"];

/**
 * The rune deck is the one zone the builder will not let you overfill. The other three are worked
 * on over time and are allowed to sit above or below their target.
 */
const cappedSections: readonly DeckSection[] = ["runeDeck"];

function sectionsSharingWith(section: DeckSection): readonly DeckSection[] {
  return sharedSections.includes(section) ? sharedSections : [section];
}

/**
 * Copies of this card already committed somewhere the player cannot change from this zone — the
 * champion zone copy, the other shared zone, or another printing of the same card.
 */
function lockedCopies(draft: DeckBuildDraft, section: DeckSection, card: Card): number {
  return copiesOfName(draft, cardIdentityName(card), sectionsSharingWith(section), {
    section,
    cardRiftboundId: card.riftboundId,
  });
}

function zoneCapacity(section: DeckSection): number | null {
  if (!cappedSections.includes(section)) return null;

  return zoneRules.find((rule) => rule.section === section)?.requiredCount ?? null;
}

/** How many more of this card the zone will take, or `null` where nothing limits it. */
function remainingForCard(draft: DeckBuildDraft, section: DeckSection, card: Card): number | null {
  const allowance = copyAllowance(section);
  const byCopies =
    allowance === null ? null : Math.max(0, allowance - lockedCopies(draft, section, card));

  const capacity = zoneCapacity(section);
  if (capacity === null) return byCopies;

  const heldByOthers =
    (zoneCounts(draft)[section] ?? 0) - quantityOf(draft, section, card.riftboundId);
  const byCapacity = Math.max(0, capacity - heldByOthers);

  return byCopies === null ? byCapacity : Math.min(byCopies, byCapacity);
}

/**
 * The chosen champion's own printing already sits in the main deck, so its row starts at one and
 * the stepper adds on top of that.
 */
function championCopies(draft: DeckBuildDraft, section: DeckSection, card: Card): number {
  if (section !== "mainDeck") return 0;

  return draft.chosenChampion?.riftboundId === card.riftboundId ? 1 : 0;
}

function displayedCopies(draft: DeckBuildDraft, section: DeckSection, card: Card): number {
  return quantityOf(draft, section, card.riftboundId) + championCopies(draft, section, card);
}

export { displayedCopies, lockedCopies, remainingForCard, zoneCapacity };
