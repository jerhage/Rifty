import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { DeckId } from "@/features/deck/deck/deck";
import { findDeck, type FindDeckCapabilities } from "@/features/deck/deck/use-cases/find-deck";
import { listDecks, type ListDecksCapabilities } from "@/features/deck/deck/use-cases/list-decks";
import {
  saveDeck,
  type DeckDraft,
  type SaveDeckCapabilities,
} from "@/features/deck/deck/use-cases/save-deck";

import { deckKeys } from "./deck-keys";

const DECK_STALE_TIME_MS = 0;

function getDeckQuery(deckId: DeckId, capabilities: FindDeckCapabilities) {
  return queryOptions({
    queryKey: deckKeys.detail(deckId),
    queryFn: ({ signal }) => findDeck(deckId, capabilities, { signal }),
    staleTime: DECK_STALE_TIME_MS,
  });
}

function listDecksQuery(capabilities: ListDecksCapabilities) {
  return queryOptions({
    queryKey: deckKeys.lists(),
    queryFn: ({ signal }) => listDecks(capabilities, { signal }),
    staleTime: DECK_STALE_TIME_MS,
  });
}

function saveDeckMutation(capabilities: SaveDeckCapabilities) {
  return mutationOptions({
    mutationFn: (draft: DeckDraft) => saveDeck(draft, capabilities),
  });
}

export { getDeckQuery, listDecksQuery, saveDeckMutation };
