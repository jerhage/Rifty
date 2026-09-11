import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { CardLister } from "@/features/card/card-lister";
import type { Deck } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { Page } from "@/shared/page";

import { deck } from "./fixtures";
import { card, cardSet } from "../card/fixtures";
import { createTestWrapper } from "../test-wrapper";

const STORE_FAILURE = new Error("The store is unavailable.");
const origins = cardSet("OGN", "2026-01-01T00:00:00");
const seated = card("ogn-001", origins.code, { name: "Ember Adept" });
const ember = deck("ember", { name: "Ember Tempo" });
const emptyDeck = deck("empty", { name: "Empty", entries: [] });

interface CardStore {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly reads: (CardListCriteria | undefined)[];
}

function createCardStore(cards: readonly Card[] | Error): CardStore {
  const reads: (CardListCriteria | undefined)[] = [];

  return {
    cardCounter: { count: () => Promise.resolve(cards instanceof Error ? 0 : cards.length) },
    cardLister: {
      getPage: (criteria) => {
        reads.push(criteria);
        return cards instanceof Error
          ? Promise.reject(cards)
          : Promise.resolve(Page.create(cards, false));
      },
    },
    reads,
  };
}

async function renderDeckDetail(store: CardStore, deckFinder: DeckFinder, deckId: string) {
  return await render(
    <DeckDetailData
      cardCounter={store.cardCounter}
      cardLister={store.cardLister}
      deckFinder={deckFinder}
      deckId={deckId}
    >
      {({ cards, deck: found }) => <Text>{`${found.name}: ${cards.length}`}</Text>}
    </DeckDetailData>,
    { wrapper: createTestWrapper() },
  );
}

function finderFor(found: Deck | null): DeckFinder {
  return { get: () => Promise.resolve(found) };
}

describe("DeckDetailData", () => {
  it("should render the deck with the cards its entries name", async () => {
    const store = createCardStore([seated]);

    await renderDeckDetail(store, finderFor(ember), ember.id);

    expect(await screen.findByText("Ember Tempo: 1")).toBeTruthy();
    expect(store.reads[0]).toMatchObject({ printingIds: ["ogn-001"] });
  });

  it("should not read cards when the deck has no entries", async () => {
    const store = createCardStore([]);

    await renderDeckDetail(store, finderFor(emptyDeck), emptyDeck.id);

    expect(await screen.findByText("Empty: 0")).toBeTruthy();
    expect(store.reads).toHaveLength(0);
  });

  it("should report a missing deck as an answer rather than a failure", async () => {
    const store = createCardStore([]);

    await renderDeckDetail(store, finderFor(null), "gone");

    expect(await screen.findByText("That deck no longer exists.")).toBeTruthy();
  });

  it("should report a failure when the deck read throws", async () => {
    const store = createCardStore([]);

    await renderDeckDetail(store, { get: () => Promise.reject(STORE_FAILURE) }, ember.id);

    expect(await screen.findByText("Could not load the deck.")).toBeTruthy();
  });

  it("should report a failure when the card read throws", async () => {
    const store = createCardStore(STORE_FAILURE);

    await renderDeckDetail(store, finderFor(ember), ember.id);

    expect(await screen.findByText("Could not load the deck.")).toBeTruthy();
  });
});
