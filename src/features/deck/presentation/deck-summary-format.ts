import { match } from "ts-pattern";

import type { Deck, DeckSection } from "@/features/deck/deck/deck";

/** Sections that make up the deck proper; the sideboard is counted and shown separately. */
const MAIN_SECTIONS: readonly DeckSection[] = ["legend", "mainDeck", "runeDeck", "battlefield"];

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
 * A deck's size at a glance, one measure per element. Legality is not asserted here: the domain
 * models that as a separate, derived verification against a ruleset, and nothing has run one.
 */
function deckCountParts(deck: Deck): readonly string[] {
  const cards = deckCardCount(deck);
  const sideboard = sideboardCount(deck);
  const cardsLabel = cards === 1 ? "1 card" : `${cards} cards`;

  return sideboard === 0 ? [cardsLabel] : [cardsLabel, `${sideboard} side`];
}

function deckCountLabel(deck: Deck): string {
  return deckCountParts(deck).join(" · ");
}

function deckListLabel(count: number): string {
  if (count === 0) return "No decks yet. Build your first list.";

  return count === 1 ? "1 list" : `${count} lists`;
}

type EditedAge =
  | { readonly unit: "unknown" }
  | { readonly unit: "justNow" }
  | { readonly unit: "yesterday" }
  | { readonly unit: "minutes"; readonly count: number }
  | { readonly unit: "hours"; readonly count: number }
  | { readonly unit: "days"; readonly count: number };

/** Deliberately coarse while the app still formats instants with `Date` rather than Temporal. */
function editedAge(updatedAt: string, now: string): EditedAge {
  const elapsedMs = Date.parse(now) - Date.parse(updatedAt);

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return { unit: "unknown" };

  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return { unit: "justNow" };
  if (minutes < 60) return { unit: "minutes", count: minutes };

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hours", count: hours };

  const days = Math.floor(hours / 24);
  return days === 1 ? { unit: "yesterday" } : { unit: "days", count: days };
}

function editedLabel(updatedAt: string, now: string): string {
  return match(editedAge(updatedAt, now))
    .with({ unit: "unknown" }, () => "edited recently")
    .with({ unit: "justNow" }, () => "edited just now")
    .with({ unit: "yesterday" }, () => "edited yesterday")
    .with({ unit: "minutes" }, ({ count }) => `edited ${count}m ago`)
    .with({ unit: "hours" }, ({ count }) => `edited ${count}h ago`)
    .with({ unit: "days" }, ({ count }) => `edited ${count}d ago`)
    .exhaustive();
}

/** The spoken counterpart of `editedLabel`, whose "3h ago" a screen reader reads as "three h ago". */
function spokenEditedLabel(updatedAt: string, now: string): string {
  return match(editedAge(updatedAt, now))
    .with({ unit: "unknown" }, () => "edited recently")
    .with({ unit: "justNow" }, () => "edited just now")
    .with({ unit: "yesterday" }, () => "edited yesterday")
    .with(
      { unit: "minutes" },
      ({ count }) => `edited ${count} ${count === 1 ? "minute" : "minutes"} ago`,
    )
    .with({ unit: "hours" }, ({ count }) => `edited ${count} ${count === 1 ? "hour" : "hours"} ago`)
    .with({ unit: "days" }, ({ count }) => `edited ${count} days ago`)
    .exhaustive();
}

export {
  deckCardCount,
  deckCountLabel,
  deckCountParts,
  deckListLabel,
  editedLabel,
  sideboardCount,
  spokenEditedLabel,
};
