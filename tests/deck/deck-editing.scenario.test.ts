import { createDeck } from "@/features/deck/deck/use-cases/create-deck";
import { deleteDeck } from "@/features/deck/deck/use-cases/delete-deck";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { listDecks } from "@/features/deck/deck/use-cases/list-decks";
import { renameDeck } from "@/features/deck/deck/use-cases/rename-deck";
import { saveDeck } from "@/features/deck/deck/use-cases/save-deck";
import { setDeckCardQuantity } from "@/features/deck/deck/use-cases/set-deck-card-quantity";

import { createSqliteScenarioStore } from "../sqlite-scenario-store";
import { cardId, deck, fixedClock, printingId, sequentialIds } from "./fixtures";

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
        chosenChampionCardId: null,
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
      {
        section: "mainDeck",
        cardId: cardId("Ember Adept"),
        printingId: printingId("ogn-014"),
        quantity: 3,
      },
      dependencies,
    );
    expect(added).toMatchObject({
      type: "success",
      deck: {
        entries: [
          { section: "mainDeck", cardId: "Ember Adept", printingId: "ogn-014", quantity: 3 },
        ],
      },
    });

    await setDeckCardQuantity(
      "ember",
      {
        section: "mainDeck",
        cardId: cardId("Ember Adept"),
        printingId: printingId("ogn-014"),
        quantity: 2,
      },
      dependencies,
    );
    await expect(findDeck("ember", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: { entries: [{ printingId: "ogn-014", quantity: 2 }] },
    });

    await setDeckCardQuantity(
      "ember",
      {
        section: "mainDeck",
        cardId: cardId("Ember Adept"),
        printingId: printingId("ogn-014"),
        quantity: 0,
      },
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
      {
        section: "mainDeck",
        cardId: cardId("Ember Adept"),
        printingId: printingId("ogn-014"),
        quantity: 2,
      },
      dependencies,
    );
    await setDeckCardQuantity(
      "ember",
      {
        section: "sideboard",
        cardId: cardId("Ember Adept"),
        printingId: printingId("ogn-014"),
        quantity: 1,
      },
      dependencies,
    );

    await expect(findDeck("ember", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: {
        entries: [
          { section: "mainDeck", cardId: "Ember Adept", printingId: "ogn-014", quantity: 2 },
          { section: "sideboard", cardId: "Ember Adept", printingId: "ogn-014", quantity: 1 },
        ],
      },
    });
    store.close();
  });

  it("refuses a fourth copy across the zones that share an allowance", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(
      deck("ember", {
        chosenChampionCardId: "Ember Hero",
        entries: [
          { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero", quantity: 1 },
          { section: "sideboard", cardId: "Ember Hero", printingId: "ogn-hero", quantity: 2 },
        ],
      }),
    );

    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "mainDeck",
          cardId: cardId("Ember Hero"),
          printingId: printingId("ogn-hero"),
          quantity: 3,
        },
        dependencies,
      ),
    ).resolves.toEqual({ type: "copyLimitReached", allowed: 1 });

    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "mainDeck",
          cardId: cardId("Ember Hero"),
          printingId: printingId("ogn-hero"),
          quantity: 1,
        },
        dependencies,
      ),
    ).resolves.toMatchObject({ type: "success" });
  });

  it("refuses a fourth copy of a card added under a second printing", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(
      deck("ember", {
        entries: [
          { section: "mainDeck", cardId: "Ember Hero", printingId: "ogn-hero", quantity: 3 },
        ],
      }),
    );

    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "mainDeck",
          cardId: cardId("Ember Hero"),
          printingId: printingId("ogn-hero-alt"),
          quantity: 1,
        },
        dependencies,
      ),
    ).resolves.toEqual({ type: "copyLimitReached", allowed: 0 });
    store.close();
  });

  it("refuses to save a card held four times across two of its printings", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);

    const rejected = await saveDeck(
      {
        id: "ember",
        name: "Ember Tempo",
        notes: "",
        createdAt: "2026-09-01T10:00:00.000Z",
        chosenChampionCardId: null,
        entries: [
          {
            section: "mainDeck",
            cardId: cardId("Ember Hero"),
            printingId: printingId("ogn-hero"),
            quantity: 3,
          },
          {
            section: "mainDeck",
            cardId: cardId("Ember Hero"),
            printingId: printingId("ogn-hero-alt"),
            quantity: 1,
          },
        ],
      },
      dependencies,
    );

    expect(rejected).toMatchObject({
      type: "copyLimitExceeded",
      violations: [
        {
          type: "cardConstraint",
          cardId: "Ember Hero",
          printingIds: ["ogn-hero", "ogn-hero-alt"],
          rule: "shared-copy-limit",
        },
      ],
    });
    await expect(findDeck("ember", dependencies)).resolves.toEqual({ type: "notFound" });
    store.close();
  });

  it("lets a zone size drift while it is being built", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(deck("ember", { entries: [] }));

    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "mainDeck",
          cardId: cardId("Ember Spark"),
          printingId: printingId("ogn-a"),
          quantity: 3,
        },
        dependencies,
      ),
    ).resolves.toMatchObject({ type: "success" });
    store.close();
  });

  it("allows any number of copies in the rune deck", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(deck("ember", { entries: [] }));

    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "runeDeck",
          cardId: cardId("Fury Rune"),
          printingId: printingId("ogn-rune"),
          quantity: 12,
        },
        dependencies,
      ),
    ).resolves.toMatchObject({ type: "success" });
    store.close();
  });

  it("saves a whole deck, then saves over it with what the builder holds", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    const draft = {
      id: "ember",
      name: "Ember Tempo",
      notes: "",
      createdAt: "2026-09-01T10:00:00.000Z",
      chosenChampionCardId: null,
      entries: [
        {
          section: "mainDeck",
          cardId: cardId("Ember Adept"),
          printingId: printingId("ogn-014"),
          quantity: 3,
        },
      ] as const,
    };

    await expect(saveDeck(draft, dependencies)).resolves.toMatchObject({
      type: "success",
      deck: { entries: [{ printingId: "ogn-014", quantity: 3 }] },
    });

    await expect(
      saveDeck(
        {
          ...draft,
          name: "Ember Aggro",
          entries: [
            {
              section: "mainDeck",
              cardId: cardId("Ember Blade"),
              printingId: printingId("ogn-020"),
              quantity: 2,
            },
          ],
        },
        dependencies,
      ),
    ).resolves.toMatchObject({ type: "success" });

    await expect(findDeck("ember", dependencies)).resolves.toMatchObject({
      type: "success",
      deck: {
        name: "Ember Aggro",
        createdAt: "2026-09-01T10:00:00.000Z",
        entries: [{ printingId: "ogn-020", quantity: 2 }],
      },
    });
    await expect(listDecks(dependencies)).resolves.toMatchObject({
      type: "success",
      decks: [{ id: "ember" }],
    });
    store.close();
  });

  it("refuses to save a deck over another deck's name, but keeps its own", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(deck("iron", { name: "Iron Wall" }));
    store.seedDeck(deck("ember", { name: "Ember Tempo" }));

    await expect(
      saveDeck(
        {
          id: "ember",
          name: "iron wall",
          notes: "",
          createdAt: "2026-09-01T10:00:00.000Z",
          chosenChampionCardId: null,
          entries: [],
        },
        dependencies,
      ),
    ).resolves.toEqual({ type: "nameTaken" });
    await expect(
      saveDeck(
        {
          id: "ember",
          name: "Ember Tempo",
          notes: "",
          createdAt: "2026-09-01T10:00:00.000Z",
          chosenChampionCardId: null,
          entries: [],
        },
        dependencies,
      ),
    ).resolves.toMatchObject({ type: "success" });
    store.close();
  });

  it("refuses a save that puts a fourth copy of a card in the shared zones", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);

    const rejected = await saveDeck(
      {
        id: "ember",
        name: "Ember Tempo",
        notes: "",
        createdAt: "2026-09-01T10:00:00.000Z",
        chosenChampionCardId: cardId("Ember Hero"),
        entries: [
          {
            section: "mainDeck",
            cardId: cardId("Ember Hero"),
            printingId: printingId("ogn-hero"),
            quantity: 3,
          },
          {
            section: "sideboard",
            cardId: cardId("Ember Hero"),
            printingId: printingId("ogn-hero"),
            quantity: 1,
          },
        ],
      },
      dependencies,
    );

    expect(rejected).toMatchObject({ type: "copyLimitExceeded" });
    await expect(findDeck("ember", dependencies)).resolves.toEqual({ type: "notFound" });
    store.close();
  });

  it("saves a deck whose zones are still the wrong size", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);

    await expect(
      saveDeck(
        {
          id: "ember",
          name: "Ember Tempo",
          notes: "",
          createdAt: "2026-09-01T10:00:00.000Z",
          chosenChampionCardId: null,
          entries: [
            {
              section: "mainDeck",
              cardId: cardId("Ember Adept"),
              printingId: printingId("ogn-014"),
              quantity: 3,
            },
          ],
        },
        dependencies,
      ),
    ).resolves.toMatchObject({ type: "success" });
    store.close();
  });

  it("deletes a deck and the entries belonging to it", async () => {
    const store = createSqliteScenarioStore();
    const dependencies = capabilities(store.deckStore);
    store.seedDeck(
      deck("ember", {
        entries: [{ section: "mainDeck", cardId: "Ember Spark", printingId: "ogn-1", quantity: 4 }],
      }),
    );

    await expect(deleteDeck("ember", dependencies)).resolves.toEqual({ type: "success" });
    await expect(findDeck("ember", dependencies)).resolves.toEqual({ type: "notFound" });
    await expect(listDecks(dependencies)).resolves.toEqual({ type: "success", decks: [] });
    store.close();
  });
});
