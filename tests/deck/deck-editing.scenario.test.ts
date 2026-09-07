import { createDeck } from "@/features/deck/deck/use-cases/create-deck";
import { deleteDeck } from "@/features/deck/deck/use-cases/delete-deck";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { listDecks } from "@/features/deck/deck/use-cases/list-decks";
import { renameDeck } from "@/features/deck/deck/use-cases/rename-deck";
import { setDeckCardQuantity } from "@/features/deck/deck/use-cases/set-deck-card-quantity";

import { createSqliteScenarioStore } from "../sqlite-scenario-store";
import { deck, fixedClock, sequentialIds } from "./fixtures";

function capabilities(repository: ReturnType<typeof createSqliteScenarioStore>["deckStore"]) {
  return {
    clock: fixedClock("2026-09-07T12:00:00.000Z", "2026-09-07T13:00:00.000Z"),
    deckFinder: repository.repository,
    deckLister: repository.repository,
    deckRemover: repository.repository,
    deckSaver: repository.repository,
    idGenerator: sequentialIds(),
  };
}

describe("deck editing scenarios", () => {
  it("creates an empty deck that is immediately readable", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);

    await expect(createDeck("Ember Tempo", dependencies)).resolves.toEqual({
      type: "success",
      deck: {
        id: "deck-1",
        name: "Ember Tempo",
        notes: "",
        createdAt: "2026-09-07T12:00:00.000Z",
        updatedAt: "2026-09-07T12:00:00.000Z",
        entries: [],
      },
    });
    await expect(listDecks(dependencies)).resolves.toMatchObject({
      type: "success",
      decks: [{ id: "deck-1", name: "Ember Tempo" }],
    });
    store.close();
  });

  it("refuses a name that differs from an existing deck only by case", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    await createDeck("Ember Tempo", dependencies);

    await expect(createDeck("  ember tempo  ", dependencies)).resolves.toEqual({
      type: "nameTaken",
    });
    store.close();
  });

  it("renames a deck and stamps it, but lets it keep its own name", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(deck("ember", { name: "Ember Tempo" }));
    store.seedDeck(deck("iron", { name: "Iron Wall" }));

    await expect(renameDeck("ember", "Ember Aggro", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: { name: "Ember Aggro", updatedAt: "2026-09-07T12:00:00.000Z" },
    });
    await expect(renameDeck("iron", "IRON WALL", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: { name: "IRON WALL" },
    });
    await expect(renameDeck("iron", "Ember Aggro", dependencies)).resolves.toEqual({
      type: "nameTaken",
    });
    await expect(renameDeck("missing", "Anything", dependencies)).resolves.toEqual({
      type: "notFound",
    });
    store.close();
  });

  it("adds, updates and removes a card quantity", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(deck("ember", { entries: [] }));

    const added = await setDeckCardQuantity(
      "ember",
      { section: "mainDeck", cardRiftboundId: "ogn-014", quantity: 3 },
      dependencies,
    );
    expect(added).toMatchObject({
      type: "success",
      deck: { entries: [{ section: "mainDeck", cardRiftboundId: "ogn-014", quantity: 3 }] },
    });

    await setDeckCardQuantity(
      "ember",
      { section: "mainDeck", cardRiftboundId: "ogn-014", quantity: 4 },
      dependencies,
    );
    await expect(findDeck("ember", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: { entries: [{ cardRiftboundId: "ogn-014", quantity: 4 }] },
    });

    await setDeckCardQuantity(
      "ember",
      { section: "mainDeck", cardRiftboundId: "ogn-014", quantity: 0 },
      dependencies,
    );
    await expect(findDeck("ember", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: { entries: [] },
    });
    store.close();
  });

  it("keeps the same card in different sections apart", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(deck("ember", { entries: [] }));

    await setDeckCardQuantity(
      "ember",
      { section: "mainDeck", cardRiftboundId: "ogn-014", quantity: 3 },
      dependencies,
    );
    await setDeckCardQuantity(
      "ember",
      { section: "sideboard", cardRiftboundId: "ogn-014", quantity: 1 },
      dependencies,
    );

    await expect(findDeck("ember", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: {
        entries: [
          { section: "mainDeck", cardRiftboundId: "ogn-014", quantity: 3 },
          { section: "sideboard", cardRiftboundId: "ogn-014", quantity: 1 },
        ],
      },
    });
    store.close();
  });

  it("deletes a deck and the entries belonging to it", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(
      deck("ember", { entries: [{ section: "mainDeck", cardRiftboundId: "ogn-1", quantity: 4 }] }),
    );

    await expect(deleteDeck("ember", dependencies)).resolves.toEqual({ type: "success" });
    await expect(findDeck("ember", dependencies)).resolves.toEqual({ type: "notFound" });
    await expect(listDecks(dependencies)).resolves.toEqual({ type: "success", decks: [] });
    store.close();
  });
});
