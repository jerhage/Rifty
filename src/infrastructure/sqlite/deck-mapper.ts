import { parseDeck, type Deck } from "@/features/deck/deck/deck";
import {
  deckCardSelectSchema,
  deckSelectSchema,
} from "@/infrastructure/database/deck-schema/decks";

interface DeckPersistenceShape {
  readonly deck: unknown;
  readonly cards: readonly unknown[];
}

function toDomainDeck({ deck, cards }: DeckPersistenceShape): Deck {
  const persistedDeck = deckSelectSchema.parse(deck);

  return parseDeck({
    id: persistedDeck.id,
    name: persistedDeck.name,
    notes: persistedDeck.notes,
    createdAt: persistedDeck.createdAt,
    updatedAt: persistedDeck.updatedAt,
    chosenChampionRiftboundId: persistedDeck.chosenChampionRiftboundId,
    entries: cards.map((card) => {
      const persistedCard = deckCardSelectSchema.parse(card);
      return {
        section: persistedCard.section,
        cardRiftboundId: persistedCard.cardRiftboundId,
        quantity: persistedCard.quantity,
      };
    }),
  });
}

export { toDomainDeck };
