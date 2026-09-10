import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Deck } from "@/features/deck/deck/deck";

function deck(id: string, options: Partial<Omit<Deck, "id">> = {}): Deck {
  return {
    id,
    name: options.name ?? `Deck ${id}`,
    notes: options.notes ?? "",
    createdAt: options.createdAt ?? "2026-09-01T10:00:00.000Z",
    updatedAt: options.updatedAt ?? "2026-09-01T10:00:00.000Z",
    chosenChampionCardId: options.chosenChampionCardId ?? null,
    entries: options.entries ?? [
      { section: "mainDeck", cardId: "Card 001", printingId: "ogn-001", quantity: 4 },
    ],
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

export { deck, fixedClock, sequentialIds };
