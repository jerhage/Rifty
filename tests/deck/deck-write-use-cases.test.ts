import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Deck } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckRemover } from "@/features/deck/deck/deck-remover";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import { createDeck } from "@/features/deck/deck/use-cases/create-deck";
import { deleteDeck } from "@/features/deck/deck/use-cases/delete-deck";
import { renameDeck } from "@/features/deck/deck/use-cases/rename-deck";
import { saveDeck, type DeckDraft } from "@/features/deck/deck/use-cases/save-deck";
import { setDeckCardQuantity } from "@/features/deck/deck/use-cases/set-deck-card-quantity";

import { cardId, deck, fixedClock, printingId, sequentialIds } from "./fixtures";

const STORE_FAILURE = new Error("The store is unavailable.");

const clock: Clock = fixedClock("2026-09-02T10:00:00.000Z");
const idGenerator: IdGenerator = sequentialIds();
const emptyLister: DeckLister = { getAll: () => Promise.resolve([]) };
const failingLister: DeckLister = { getAll: () => Promise.reject(STORE_FAILURE) };
const failingFinder: DeckFinder = { get: () => Promise.reject(STORE_FAILURE) };
const failingSaver: DeckSaver = { save: () => Promise.reject(STORE_FAILURE) };
const failingRemover: DeckRemover = { remove: () => Promise.reject(STORE_FAILURE) };
const storedDeck = deck("ember", { name: "Ember Tempo" });
const foundFinder: DeckFinder = { get: () => Promise.resolve(storedDeck) };

function draft(overrides: Partial<DeckDraft> = {}): DeckDraft {
  return {
    id: "ember",
    name: "Ember Tempo",
    notes: "",
    createdAt: "2026-09-01T10:00:00.000Z",
    chosenChampion: null,
    entries: [
      {
        section: "mainDeck",
        cardId: cardId("Card 001"),
        printingId: printingId("ogn-001"),
        quantity: 1,
      },
    ],
    ...overrides,
  };
}

function recordingSaver(): { readonly saver: DeckSaver; readonly written: Deck[] } {
  const written: Deck[] = [];

  return {
    saver: {
      save: (saved: Deck) => {
        written.push(saved);
        return Promise.resolve();
      },
    },
    written,
  };
}

describe("deck write use cases", () => {
  it("should report a missing name when a saved draft has an empty name", async () => {
    await expect(
      saveDeck(draft({ name: "" }), { clock, deckLister: emptyLister, deckSaver: failingSaver }),
    ).resolves.toEqual({ type: "nameMissing" });
  });

  it("should report a missing name when a saved draft has a whitespace-only name", async () => {
    await expect(
      saveDeck(draft({ name: "   " }), { clock, deckLister: emptyLister, deckSaver: failingSaver }),
    ).resolves.toEqual({ type: "nameMissing" });
  });

  it("should persist the trimmed name of a saved draft", async () => {
    const { saver, written } = recordingSaver();

    await expect(
      saveDeck(draft({ name: "  Ember Tempo  " }), {
        clock,
        deckLister: emptyLister,
        deckSaver: saver,
      }),
    ).resolves.toMatchObject({ type: "success", deck: { name: "Ember Tempo" } });
    expect(written).toMatchObject([{ name: "Ember Tempo" }]);
  });

  it("should report a missing name when a created deck has a whitespace-only name", async () => {
    await expect(
      createDeck("   ", {
        clock,
        deckLister: emptyLister,
        deckSaver: failingSaver,
        idGenerator,
      }),
    ).resolves.toEqual({ type: "nameMissing" });
  });

  it("should report a missing name when a rename has a whitespace-only name", async () => {
    await expect(
      renameDeck("ember", "   ", {
        clock,
        deckFinder: foundFinder,
        deckLister: emptyLister,
        deckSaver: failingSaver,
      }),
    ).resolves.toEqual({ type: "nameMissing" });
  });

  it("should reject rather than answer when creating a deck reads a failing store", async () => {
    await expect(
      createDeck("Ember Tempo", {
        clock,
        deckLister: failingLister,
        deckSaver: failingSaver,
        idGenerator,
      }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when writing a created deck fails", async () => {
    await expect(
      createDeck("Ember Tempo", {
        clock,
        deckLister: emptyLister,
        deckSaver: failingSaver,
        idGenerator,
      }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when renaming reads a failing store", async () => {
    await expect(
      renameDeck("ember", "Ember Aggro", {
        clock,
        deckFinder: failingFinder,
        deckLister: emptyLister,
        deckSaver: failingSaver,
      }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when saving a deck reads a failing store", async () => {
    await expect(
      saveDeck(draft(), { clock, deckLister: failingLister, deckSaver: failingSaver }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when writing a saved deck fails", async () => {
    await expect(
      saveDeck(draft(), { clock, deckLister: emptyLister, deckSaver: failingSaver }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when a saved draft violates a deck invariant", async () => {
    const duplicated = draft({
      entries: [
        {
          section: "mainDeck",
          cardId: cardId("Card 001"),
          printingId: printingId("ogn-001"),
          quantity: 1,
        },
        {
          section: "mainDeck",
          cardId: cardId("Card 001"),
          printingId: printingId("ogn-001"),
          quantity: 2,
        },
      ],
    });

    await expect(
      saveDeck(duplicated, { clock, deckLister: emptyLister, deckSaver: failingSaver }),
    ).rejects.toThrow();
  });

  it("should reject rather than answer when deleting a deck fails", async () => {
    await expect(deleteDeck("ember", { deckRemover: failingRemover })).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when setting a quantity reads a failing store", async () => {
    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "mainDeck",
          cardId: cardId("Card 002"),
          printingId: printingId("ogn-002"),
          quantity: 1,
        },
        { clock, deckFinder: failingFinder, deckSaver: failingSaver },
      ),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when writing a changed quantity fails", async () => {
    await expect(
      setDeckCardQuantity(
        "ember",
        {
          section: "mainDeck",
          cardId: cardId("Card 002"),
          printingId: printingId("ogn-002"),
          quantity: 1,
        },
        { clock, deckFinder: foundFinder, deckSaver: failingSaver },
      ),
    ).rejects.toBe(STORE_FAILURE);
  });
});
