import type { Deck } from "@/features/deck/deck/deck";

function deck(id: string, options: Partial<Omit<Deck, "id">> = {}): Deck {
  return {
    id,
    name: options.name ?? `Deck ${id}`,
    notes: options.notes ?? "",
    createdAt: options.createdAt ?? "2026-09-01T10:00:00.000Z",
    updatedAt: options.updatedAt ?? "2026-09-01T10:00:00.000Z",
    entries: options.entries ?? [{ section: "mainDeck", cardRiftboundId: "ogn-001", quantity: 4 }],
  };
}

export { deck };
