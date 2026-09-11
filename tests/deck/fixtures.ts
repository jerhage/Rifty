import type { z } from "zod/v4";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Card } from "@/features/card/card";
import { cardIdSchema, type CardId } from "@/features/card/value-objects/card-id";
import { printingIdSchema, type PrintingId } from "@/features/card/value-objects/printing-id";
import { deckSchema, parseDeck, type Deck } from "@/features/deck/deck/deck";
import type { ResolvedDeck } from "@/features/deck/deck/resolved-deck";

import { card, cardSet } from "../card/fixtures";
import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";

type DeckInput = z.input<typeof deckSchema>;
type DeckEntryInput = DeckInput["entries"][number];

const DECK_CATALOG_SET = cardSet("OGN", "2026-01-01T00:00:00", "Origins");
const DECK_CATALOG_PRINTINGS: readonly {
  readonly cardId: string;
  readonly printingId: string;
}[] = [
  { cardId: "Card 001", printingId: "ogn-001" },
  { cardId: "Ember Adept", printingId: "ogn-014" },
  { cardId: "Ember Answer", printingId: "ogn-050" },
  { cardId: "Ember Blade", printingId: "ogn-020" },
  { cardId: "Ember Field", printingId: "ogn-100" },
  { cardId: "Ember Hero", printingId: "ogn-hero" },
  { cardId: "Ember Hero", printingId: "ogn-hero-alt" },
  { cardId: "Ember Legend", printingId: "ogn-003" },
  { cardId: "Ember Spark", printingId: "ogn-1" },
  { cardId: "Ember Spark", printingId: "ogn-a" },
  { cardId: "Fury Rune", printingId: "ogn-rune" },
];

/** A store whose catalog already holds every card and printing the deck scenarios reference. */
function deckScenarioStore(): SqliteScenarioStore {
  const store = createSqliteScenarioStore();
  store.seedSet(DECK_CATALOG_SET);
  for (const entry of DECK_CATALOG_PRINTINGS) {
    store.seedCard(
      card(entry.printingId, DECK_CATALOG_SET.code, {
        cardId: cardId(entry.cardId),
        name: entry.cardId,
      }),
    );
  }

  return store;
}

function cardId(value: string): CardId {
  return cardIdSchema.parse(value);
}

function printingId(value: string): PrintingId {
  return printingIdSchema.parse(value);
}

function deck(id: string, options: Partial<Omit<DeckInput, "id">> = {}): Deck {
  return parseDeck({
    id,
    name: options.name ?? `Deck ${id}`,
    notes: options.notes ?? "",
    createdAt: options.createdAt ?? "2026-09-01T10:00:00.000Z",
    updatedAt: options.updatedAt ?? "2026-09-01T10:00:00.000Z",
    chosenChampionCardId: options.chosenChampionCardId ?? null,
    entries: options.entries ?? [
      { section: "mainDeck", cardId: "Card 001", printingId: "ogn-001", quantity: 4 },
    ],
  });
}

/** Pairs every entry of a deck with the card fixture whose printing it names. */
function resolvedDeck(
  source: Deck,
  cards: readonly Card[],
  chosenChampionCard: Card | null = null,
): ResolvedDeck {
  const byPrintingId = new Map(cards.map((held) => [held.printingId, held]));

  return {
    deck: source,
    entries: source.entries.map((entry) => {
      const held = byPrintingId.get(entry.printingId);
      if (!held) throw new Error(`No card fixture for printing ${entry.printingId}.`);

      return { section: entry.section, card: held, quantity: entry.quantity };
    }),
    chosenChampionCard,
  };
}

/** Hands out the given instants in order, repeating the last one once they run out. */
function fixedClock(...instants: readonly string[]): Clock {
  let index = 0;

  return {
    now: () => instants[Math.min(index++, instants.length - 1)] ?? "2026-09-01T10:00:00.000Z",
  };
}

function sequentialIds(prefix = "deck"): IdGenerator {
  let index = 0;

  return { next: () => `${prefix}-${++index}` };
}

export { cardId, deck, deckScenarioStore, fixedClock, printingId, resolvedDeck, sequentialIds };
export type { DeckEntryInput };
