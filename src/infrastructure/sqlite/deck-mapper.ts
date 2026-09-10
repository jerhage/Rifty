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
    chosenChampionCardId: persistedDeck.chosenChampionCardId,
    entries: cards.map((card) => {
      const persistedCard = deckCardSelectSchema.parse(card);
      return {
        section: persistedCard.section,
        cardId: persistedCard.cardId,
        printingId: persistedCard.printingId,
        quantity: persistedCard.quantity,
      };
    }),
  });
}

export { toDomainDeck };
