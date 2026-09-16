import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { findResolvedDeck } from "@/features/deck/deck/use-cases/find-resolved-deck";
import { listDecks } from "@/features/deck/deck/use-cases/list-decks";

import { deck, deckScenarioStore } from "./fixtures";

describe("deck storage scenarios", () => {
  it("should hydrate a saved deck with every section it holds, ordered by section", async () => {
    const store = deckScenarioStore();
    const tempo = deck("ember-tempo", {
      name: "Ember Tempo",
      entries: [
        { section: "mainDeck", cardId: "Ember Adept", printingId: "ogn-014", quantity: 3 },
        { section: "legend", cardId: "Ember Legend", printingId: "ogn-003", quantity: 1 },
        { section: "battlefield", cardId: "Ember Field", printingId: "ogn-100", quantity: 2 },
        { section: "sideboard", cardId: "Ember Answer", printingId: "ogn-050", quantity: 1 },
      ],
    });
    store.seedDeck(tempo);

    await expect(
      findDeck("ember-tempo", { deckFinder: store.deckStore.repository }),
    ).resolves.toEqual({
      type: "success",
      deck: {
        ...tempo,
        entries: [
          { section: "battlefield", cardId: "Ember Field", printingId: "ogn-100", quantity: 2 },
          { section: "legend", cardId: "Ember Legend", printingId: "ogn-003", quantity: 1 },
          { section: "mainDeck", cardId: "Ember Adept", printingId: "ogn-014", quantity: 3 },
          { section: "sideboard", cardId: "Ember Answer", printingId: "ogn-050", quantity: 1 },
        ],
      },
    });
    store.close();
  });

  it("should pair a saved deck's entries with the catalog and seat its chosen champion", async () => {
    const store = deckScenarioStore();
    const tempo = deck("ember-tempo", {
      chosenChampionCardId: "Ember Hero",
      entries: [
        { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero-alt", quantity: 1 },
        { section: "runeDeck", cardId: "Fury Rune", printingId: "ogn-rune", quantity: 4 },
      ],
    });
    store.seedDeck(tempo);

    await expect(
      findResolvedDeck("ember-tempo", {
        cardByCardIdFinder: store.cards,
        cardsByPrintingIdsFinder: store.cards,
        deckFinder: store.deckStore.repository,
      }),
    ).resolves.toMatchObject({
      type: "success",
      resolvedDeck: {
        chosenChampionCard: { printingId: "ogn-hero-alt" },
        entries: [
          { section: "mainDeck", card: { printingId: "ogn-hero-alt" }, quantity: 1 },
          { section: "runeDeck", card: { printingId: "ogn-rune" }, quantity: 4 },
        ],
      },
    });
    store.close();
  });

  it("should read a chosen champion the main deck does not seat", async () => {
    const store = deckScenarioStore();
    const tempo = deck("ember-tempo", {
      chosenChampionCardId: "Ember Hero",
      entries: [{ section: "runeDeck", cardId: "Fury Rune", printingId: "ogn-rune", quantity: 4 }],
    });
    store.seedDeck(tempo);

    await expect(
      findResolvedDeck("ember-tempo", {
        cardByCardIdFinder: store.cards,
        cardsByPrintingIdsFinder: store.cards,
        deckFinder: store.deckStore.repository,
      }),
    ).resolves.toMatchObject({
      type: "success",
      resolvedDeck: { chosenChampionCard: { cardId: "Ember Hero", printingId: "ogn-hero" } },
    });
    store.close();
  });

  it("should report an absent deck without treating it as a storage failure", async () => {
    const store = deckScenarioStore();

    await expect(findDeck("unknown", { deckFinder: store.deckStore.repository })).resolves.toEqual({
      type: "notFound",
    });
    store.close();
  });

  it("should list decks most recently edited first", async () => {
    const store = deckScenarioStore();
    const older = deck("iron-wall", { name: "Iron Wall", updatedAt: "2026-09-01T10:00:00.000Z" });
    const newer = deck("veil-tempo", { name: "Veil Tempo", updatedAt: "2026-09-07T18:30:00.000Z" });
    store.seedDeck(older);
    store.seedDeck(newer);

    await expect(listDecks({ deckLister: store.deckStore.repository })).resolves.toEqual({
      type: "success",
      decks: [newer, older],
    });
    store.close();
  });

  it("should keep a deck with no entries readable", async () => {
    const store = deckScenarioStore();
    store.seedDeck(deck("empty", { entries: [] }));

    await expect(listDecks({ deckLister: store.deckStore.repository })).resolves.toMatchObject({
      type: "success",
      decks: [{ id: "empty", entries: [] }],
    });
    store.close();
  });
});
