import type { DeckId } from "@/features/deck/deck/deck";

const deckKeys = {
  all: () => ["deck"] as const,
  detail: (deckId: DeckId) => [...deckKeys.all(), "detail", deckId] as const,
  list: () => [...deckKeys.all(), "list"] as const,
};

export { deckKeys };
