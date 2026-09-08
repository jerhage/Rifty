import type { Deck, DeckSection } from "@/features/deck/deck/deck";

/** Sections that make up the deck proper; the sideboard is counted and shown separately. */
const MAIN_SECTIONS: readonly DeckSection[] = [
  "legend",
  "chosenChampion",
  "mainDeck",
  "runeDeck",
  "battlefield",
];

function cardCount(deck: Deck, sections: readonly DeckSection[]): number {
  return deck.entries
    .filter((entry) => sections.includes(entry.section))
    .reduce((total, entry) => total + entry.quantity, 0);
}

function deckCardCount(deck: Deck): number {
  return cardCount(deck, MAIN_SECTIONS);
}

function sideboardCount(deck: Deck): number {
  return cardCount(deck, ["sideboard"]);
}

/**
 * A deck's size at a glance. Legality is not asserted here: the domain models that as a separate,
 * derived verification against a ruleset, and nothing has run one.
 */
function deckCountLabel(deck: Deck): string {
  const cards = deckCardCount(deck);
  const sideboard = sideboardCount(deck);
  const cardsLabel = cards === 1 ? "1 card" : `${cards} cards`;

  return sideboard === 0 ? cardsLabel : `${cardsLabel} · ${sideboard} side`;
}

/** Deliberately coarse while the app still formats instants with `Date` rather than Temporal. */
function editedLabel(updatedAt: string, now: string): string {
  const elapsedMs = Date.parse(now) - Date.parse(updatedAt);

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "edited recently";

  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "edited just now";
  if (minutes < 60) return `edited ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `edited ${hours}h ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "edited yesterday" : `edited ${days}d ago`;
}

export { deckCardCount, deckCountLabel, editedLabel, sideboardCount };
