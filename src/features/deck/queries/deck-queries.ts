import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { DeckId } from "@/features/deck/deck/deck";
import {
  findResolvedDeck,
  type FindResolvedDeckCapabilities,
} from "@/features/deck/deck/use-cases/find-resolved-deck";
import { listDecks, type ListDecksCapabilities } from "@/features/deck/deck/use-cases/list-decks";
import {
  saveDeck,
  type DeckDraft,
  type SaveDeckCapabilities,
} from "@/features/deck/deck/use-cases/save-deck";

import { deckKeys } from "./deck-keys";

const DECK_STALE_TIME_MS = 5 * 60 * 1000;

function getResolvedDeckQuery(deckId: DeckId, capabilities: FindResolvedDeckCapabilities) {
  return queryOptions({
    queryKey: deckKeys.detail(deckId),
    queryFn: ({ signal }) => findResolvedDeck(deckId, capabilities, { signal }),
    staleTime: DECK_STALE_TIME_MS,
  });
}

function listDecksQuery(capabilities: ListDecksCapabilities) {
  return queryOptions({
    queryKey: deckKeys.list(),
    queryFn: ({ signal }) => listDecks(capabilities, { signal }),
    staleTime: DECK_STALE_TIME_MS,
  });
}

function saveDeckMutation(capabilities: SaveDeckCapabilities) {
  return mutationOptions({
    mutationFn: (draft: DeckDraft) => saveDeck(draft, capabilities),
  });
}

export { getResolvedDeckQuery, listDecksQuery, saveDeckMutation };
