import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { match } from "ts-pattern";

import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { MissingDeck } from "@/features/deck/presentation/components/missing-deck";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { linkedDeck } from "@/features/deck/presentation/linked-deck";

import { deck } from "./fixtures";
import { card, cardSet } from "../card/fixtures";
import { createTestWrapper } from "../test-wrapper";

const origins = cardSet("OGN", "2026-01-01T00:00:00");
const seated = card("ogn-001", origins.code, { name: "Ember Adept" });
const ember = deck("ember", { name: "Ember Tempo" });

const noChampionPrinting: CardByCardIdFinder = { getByCardId: () => Promise.resolve(null) };
const seatedCards: CardsByPrintingIdsFinder = {
  getAllByPrintingIds: () => Promise.resolve([seated]),
};

interface DeckStore {
  readonly deckFinder: DeckFinder;
  asks(): readonly DeckId[];
}

function createDeckStore(stored: Deck): DeckStore {
  const asks: DeckId[] = [];

  return {
    asks: () => asks,
    deckFinder: {
      get: (id) => {
        asks.push(id);

        return Promise.resolve(id === stored.id ? stored : null);
      },
    },
  };
}

async function renderLinkedDeck(store: DeckStore, parameter: string) {
  return await render(
    match(linkedDeck(parameter))
      .with({ type: "unknownDeck" }, () => <MissingDeck />)
      .with({ type: "savedDeck" }, ({ deckId }) => (
        <DeckDetailData
          cardByCardIdFinder={noChampionPrinting}
          cardsByPrintingIdsFinder={seatedCards}
          deckFinder={store.deckFinder}
          deckId={deckId}
        >
          {({ resolvedDeck }) => <Text>{resolvedDeck.deck.name}</Text>}
        </DeckDetailData>
      ))
      .exhaustive(),
    { wrapper: createTestWrapper() },
  );
}

describe("the deck a link names", () => {
  it("should ask the store for the deck a well-formed link names", async () => {
    const store = createDeckStore(ember);

    await renderLinkedDeck(store, "ember");

    expect(await screen.findByText("Ember Tempo")).toBeTruthy();
    expect(store.asks()).toEqual(["ember"]);
  });

  it("should trim a link's surrounding space before asking the store", async () => {
    const store = createDeckStore(ember);

    await renderLinkedDeck(store, "  ember  ");

    expect(await screen.findByText("Ember Tempo")).toBeTruthy();
    expect(store.asks()).toEqual(["ember"]);
  });

  it("should report a blank deck id as no deck rather than asking the store for it", async () => {
    const store = createDeckStore(ember);

    await renderLinkedDeck(store, " ");

    expect(await screen.findByText("That deck no longer exists.")).toBeTruthy();
    expect(store.asks()).toEqual([]);
  });

  it("should report an empty deck id as no deck", () => {
    expect(linkedDeck("")).toEqual({ type: "unknownDeck" });
  });
});
