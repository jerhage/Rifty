import type { z } from "zod/v4";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { cardIdSchema, type CardId } from "@/features/card/value-objects/card-id";
import { printingIdSchema, type PrintingId } from "@/features/card/value-objects/printing-id";
import { deckSchema, parseDeck, type Deck } from "@/features/deck/deck/deck";

type DeckInput = z.input<typeof deckSchema>;
type DeckEntryInput = DeckInput["entries"][number];

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

export { cardId, deck, fixedClock, printingId, sequentialIds };
export type { DeckEntryInput };
