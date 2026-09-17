import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { Deck, DeckVerification } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import { resolvedComposition } from "@/features/deck/deck/resolved-deck";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { findResolvedDeck } from "@/features/deck/deck/use-cases/find-resolved-deck";
import { listDecks } from "@/features/deck/deck/use-cases/list-decks";

import { card, taxonomy, taxonomyId } from "../card/fixtures";
import { cardId, deck, deckId } from "./fixtures";

const STORE_FAILURE = new Error("The store is unavailable.");

const failingDeckFinder: DeckFinder = { get: () => Promise.reject(STORE_FAILURE) };
const failingDeckLister: DeckLister = { getAll: () => Promise.reject(STORE_FAILURE) };

const champion = card("ogn-hero", "OGN", { cardId: cardId("Ember Hero"), name: "Ember Hero" });
const alternateChampion = card("ogn-hero-alt", "OGN", {
  cardId: cardId("Ember Hero"),
  name: "Ember Hero (Alternate Art)",
});
const spark = card("ogn-1", "OGN", { cardId: cardId("Ember Spark"), name: "Ember Spark" });
const legend = card("ogn-003", "OGN", {
  cardId: cardId("Ember Legend"),
  name: "Ember Legend",
  classification: {
    typeId: "Legend",
    supertypeId: taxonomyId("Champion"),
    rarity: taxonomy("rare"),
  },
});

function finderFor(found: Deck | null): DeckFinder {
  return { get: () => Promise.resolve(found) };
}

function cardsFor(cards: readonly Card[]): CardsByPrintingIdsFinder {
  return {
    getAllByPrintingIds: (printingIds) =>
      Promise.resolve(cards.filter((held) => printingIds.includes(held.printingId))),
  };
}

function championFor(found: Card | null): CardByCardIdFinder {
  return { getByCardId: () => Promise.resolve(found) };
}

function capabilitiesFor(
  found: Deck | null,
  cards: readonly Card[],
  championCard: Card | null = null,
) {
  return {
    cardByCardIdFinder: championFor(championCard),
    cardsByPrintingIdsFinder: cardsFor(cards),
    deckFinder: finderFor(found),
  };
}

describe("deck read use cases", () => {
  it("should reject rather than answer when finding a deck fails", async () => {
    await expect(findDeck(deckId("ember"), { deckFinder: failingDeckFinder })).rejects.toBe(
      STORE_FAILURE,
    );
  });

  it("should reject rather than answer when listing decks fails", async () => {
    await expect(listDecks({ deckLister: failingDeckLister })).rejects.toBe(STORE_FAILURE);
  });
});

describe("finding a resolved deck", () => {
  it("should report a missing deck as an answer rather than a failure", async () => {
    await expect(findResolvedDeck(deckId("gone"), capabilitiesFor(null, []))).resolves.toEqual({
      type: "notFound",
    });
  });

  it("should pair every entry with the printing that entry names", async () => {
    const mixed = deck("ember", {
      entries: [
        { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero", quantity: 2 },
        { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero-alt", quantity: 1 },
        { section: "runeDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 },
      ],
    });

    const found = await findResolvedDeck(
      mixed.id,
      capabilitiesFor(mixed, [champion, alternateChampion, spark]),
    );

    expect(found).toMatchObject({
      type: "success",
      resolvedDeck: {
        chosenChampionCard: null,
        entries: [
          { section: "mainDeck", card: { printingId: "ogn-hero" }, quantity: 2 },
          { section: "mainDeck", card: { printingId: "ogn-hero-alt" }, quantity: 1 },
          { section: "runeDeck", card: { printingId: "ogn-1" }, quantity: 4 },
        ],
      },
    });
  });

  it("should throw when an entry names a printing no card resolves", async () => {
    const stranded = deck("ember", {
      entries: [
        { section: "mainDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 },
        { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero", quantity: 1 },
      ],
    });

    await expect(findResolvedDeck(stranded.id, capabilitiesFor(stranded, [spark]))).rejects.toThrow(
      "Deck ember names printing ogn-hero, which the catalog does not hold.",
    );
  });

  it("should name the chosen champion's own seated printing without reading the catalog", async () => {
    const seatedAlternate = deck("ember", {
      chosenChampionCardId: "Ember Hero",
      entries: [
        { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero-alt", quantity: 1 },
      ],
    });
    const capabilities = {
      cardByCardIdFinder: {
        getByCardId: () => Promise.reject(new Error("The champion was already seated.")),
      },
      cardsByPrintingIdsFinder: cardsFor([champion, alternateChampion]),
      deckFinder: finderFor(seatedAlternate),
    };

    await expect(findResolvedDeck(seatedAlternate.id, capabilities)).resolves.toMatchObject({
      type: "success",
      resolvedDeck: { chosenChampionCard: { printingId: "ogn-hero-alt" } },
    });
  });

  it("should read the chosen champion when the main deck does not seat it", async () => {
    const unseated = deck("ember", {
      chosenChampionCardId: "Ember Hero",
      entries: [{ section: "runeDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 }],
    });

    await expect(
      findResolvedDeck(unseated.id, capabilitiesFor(unseated, [spark], champion)),
    ).resolves.toMatchObject({
      type: "success",
      resolvedDeck: { chosenChampionCard: { printingId: "ogn-hero" } },
    });
  });

  it("should throw when the chosen champion resolves to no card", async () => {
    const unseated = deck("ember", {
      chosenChampionCardId: "Ember Hero",
      entries: [{ section: "runeDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 }],
    });

    await expect(findResolvedDeck(unseated.id, capabilitiesFor(unseated, [spark]))).rejects.toThrow(
      "Deck ember names champion Ember Hero, which the catalog does not hold.",
    );
  });

  it("should open a saved deck whose chosen champion is a legend and report the violation", async () => {
    const saved = deck("ember", {
      chosenChampionCardId: "Ember Legend",
      entries: [
        { section: "legend", cardId: "Ember Legend", printingId: "ogn-003", quantity: 1 },
        { section: "mainDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 },
      ],
    });

    const found = await findResolvedDeck(saved.id, capabilitiesFor(saved, [legend, spark], legend));
    const verification = match(found)
      .with({ type: "success" }, ({ resolvedDeck }) =>
        verifyDeck(resolvedComposition(resolvedDeck), RIFTBOUND_STANDARD),
      )
      .with({ type: "notFound" }, (): DeckVerification => {
        throw new Error("The saved deck did not resolve.");
      })
      .exhaustive();

    expect(verification).toMatchObject({
      type: "illegal",
      violations: expect.arrayContaining([
        expect.objectContaining({
          cardId: "Ember Legend",
          rule: { kind: "championIsChampionUnit" },
        }),
      ]),
    });
  });

  it("should resolve a deck whose chosen champion is null", async () => {
    const championless = deck("ember", {
      chosenChampionCardId: null,
      entries: [{ section: "runeDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 }],
    });

    await expect(
      findResolvedDeck(championless.id, capabilitiesFor(championless, [spark])),
    ).resolves.toMatchObject({
      type: "success",
      resolvedDeck: { chosenChampionCard: null, entries: [{ quantity: 4 }] },
    });
  });
});
