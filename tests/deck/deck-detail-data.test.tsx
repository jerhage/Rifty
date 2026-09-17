import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import type { Card } from "@/features/card/card";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";

import { deck, deckId } from "./fixtures";
import { card, cardSet } from "../card/fixtures";
import { createTestWrapper } from "../test-wrapper";

const STORE_FAILURE = new Error("The store is unavailable.");
const origins = cardSet("OGN", "2026-01-01T00:00:00");
const seated = card("ogn-001", origins.code, { name: "Ember Adept" });
const ember = deck("ember", { name: "Ember Tempo" });
const emptyDeck = deck("empty", { name: "Empty", entries: [] });

const noChampionPrinting: CardByCardIdFinder = { getByCardId: () => Promise.resolve(null) };

interface CardStore {
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
  readonly reads: (readonly PrintingId[])[];
}

function createCardStore(cards: readonly Card[] | Error): CardStore {
  const reads: (readonly PrintingId[])[] = [];

  return {
    cardsByPrintingIdsFinder: {
      getAllByPrintingIds: (printingIds) => {
        reads.push(printingIds);
        return cards instanceof Error ? Promise.reject(cards) : Promise.resolve(cards);
      },
    },
    reads,
  };
}

async function renderDeckDetail(store: CardStore, deckFinder: DeckFinder, id: DeckId) {
  return await render(
    <DeckDetailData
      cardByCardIdFinder={noChampionPrinting}
      cardsByPrintingIdsFinder={store.cardsByPrintingIdsFinder}
      deckFinder={deckFinder}
      deckId={id}
    >
      {({ resolvedDeck }) => (
        <Text>{`${resolvedDeck.deck.name}: ${resolvedDeck.entries.length}`}</Text>
      )}
    </DeckDetailData>,
    { wrapper: createTestWrapper() },
  );
}

function finderFor(found: Deck | null): DeckFinder {
  return { get: () => Promise.resolve(found) };
}

describe("DeckDetailData", () => {
  it("should render the deck with its entries paired to the cards they name", async () => {
    const store = createCardStore([seated]);

    await renderDeckDetail(store, finderFor(ember), ember.id);

    expect(await screen.findByText("Ember Tempo: 1")).toBeTruthy();
    expect(store.reads[0]).toEqual(["ogn-001"]);
  });

  it("should not read cards when the deck has no entries", async () => {
    const store = createCardStore([]);

    await renderDeckDetail(store, finderFor(emptyDeck), emptyDeck.id);

    expect(await screen.findByText("Empty: 0")).toBeTruthy();
    expect(store.reads).toHaveLength(0);
  });

  it("should report a missing deck as an answer rather than a failure", async () => {
    const store = createCardStore([]);

    await renderDeckDetail(store, finderFor(null), deckId("gone"));

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

  it("should report a failure when an entry names a printing the catalog does not hold", async () => {
    const store = createCardStore([]);

    await renderDeckDetail(store, finderFor(ember), ember.id);

    expect(await screen.findByText("Could not load the deck.")).toBeTruthy();
  });
});
