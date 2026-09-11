import type { DeckId } from "@/features/deck/deck/deck";

const deckKeys = {
  all: () => ["deck"] as const,
  details: () => [...deckKeys.all(), "detail"] as const,
  detail: (deckId: DeckId) => [...deckKeys.details(), deckId] as const,
  lists: () => [...deckKeys.all(), "list"] as const,
};

export { deckKeys };
