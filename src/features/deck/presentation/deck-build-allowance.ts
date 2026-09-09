import type { Card } from "@/features/catalog/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";
import { copyAllowance, ZONE_RULES } from "@/features/deck/deck/deck-legality";

import { copiesOfName, quantityOf, zoneCounts, type DeckBuildDraft } from "./deck-build-steps";

const SHARED_SECTIONS: readonly DeckSection[] = ["mainDeck", "sideboard"];

/**
 * The rune deck is the one zone the builder will not let you overfill. The other three are worked
 * on over time and are allowed to sit above or below their target.
 */
const CAPPED_SECTIONS: readonly DeckSection[] = ["runeDeck"];

function sectionsSharingWith(section: DeckSection): readonly DeckSection[] {
  return SHARED_SECTIONS.includes(section) ? SHARED_SECTIONS : [section];
}

/**
 * Copies of this card already committed somewhere the player cannot change from this zone — the
 * other shared zone, or another printing of the same card.
 */
function lockedCopies(draft: DeckBuildDraft, section: DeckSection, card: Card): number {
  return copiesOfName(draft, card.identityName, sectionsSharingWith(section), {
    section,
    cardRiftboundId: card.riftboundId,
  });
}

function zoneCapacity(section: DeckSection): number | null {
  if (!CAPPED_SECTIONS.includes(section)) return null;

  return ZONE_RULES.find((rule) => rule.section === section)?.requiredCount ?? null;
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
 * The deck names one of its main deck cards as the chosen champion, so that printing cannot be
 * taken out from under it.
 */
function minimumForCard(draft: DeckBuildDraft, section: DeckSection, card: Card): number {
  return section === "mainDeck" && draft.chosenChampion?.riftboundId === card.riftboundId ? 1 : 0;
}

export { lockedCopies, minimumForCard, remainingForCard, zoneCapacity };
