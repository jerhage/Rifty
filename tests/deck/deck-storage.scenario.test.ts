import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { listDecks } from "@/features/deck/deck/use-cases/list-decks";

import { createSqliteScenarioStore } from "../sqlite-scenario-store";
import { deck } from "./fixtures";

describe("deck storage scenarios", () => {
  it("hydrates a saved deck with every section it holds", async () => {
    const store = createSqliteScenarioStore();
    const tempo = deck("ember-tempo", {
      name: "Ember Tempo",
      notes: "Fast board pressure.",
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

  it("reports an absent deck without treating it as a storage failure", async () => {
    const store = createSqliteScenarioStore();

    await expect(findDeck("unknown", { deckFinder: store.deckStore.repository })).resolves.toEqual({
      type: "notFound",
    });
    store.close();
  });

  it("lists decks most recently edited first", async () => {
    const store = createSqliteScenarioStore();
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

  it("keeps a deck with no entries readable", async () => {
    const store = createSqliteScenarioStore();
    store.seedDeck(deck("empty", { entries: [] }));

    await expect(listDecks({ deckLister: store.deckStore.repository })).resolves.toMatchObject({
      type: "success",
      decks: [{ id: "empty", entries: [] }],
    });
    store.close();
  });
});
