import { parseDeck, parseDeckVerification } from "@/features/deck/deck/deck";

const deck = {
  id: "deck-1",
  name: "Untitled deck",
  notes: "",
  createdAt: "2026-09-07T00:00:00.000Z",
  updatedAt: "2026-09-07T00:00:00.000Z",
  chosenChampionCardId: null,
  entries: [
    {
      section: "mainDeck",
      cardId: "Miss Fortune, Bounty Hunter",
      printingId: "ogn-001-298",
      quantity: 4,
    },
  ],
};

describe("deck schema", () => {
  it("accepts incomplete decks so people can build freely", () => {
    expect(parseDeck(deck)).toEqual(deck);
  });

  it("rejects duplicate quantity entries for one printing in a section", () => {
    expect(() =>
      parseDeck({
        ...deck,
        entries: [
          ...deck.entries,
          {
            section: "mainDeck",
            cardId: "Miss Fortune, Bounty Hunter",
            printingId: "ogn-001-298",
            quantity: 1,
          },
        ],
      }),
    ).toThrow("only one quantity entry");
  });

  it("accepts two printings of one card in the same section", () => {
    expect(
      parseDeck({
        ...deck,
        entries: [
          ...deck.entries,
          {
            section: "mainDeck",
            cardId: "Miss Fortune, Bounty Hunter",
            printingId: "ogn-001a-298",
            quantity: 1,
          },
        ],
      }).entries,
    ).toHaveLength(2);
  });

  it("derives unverified, legal, and illegal verification states from one schema", () => {
    expect(
      parseDeckVerification({ type: "unverified", deck, reason: { type: "notChecked" } }),
    ).toMatchObject({ type: "unverified" });
    expect(
      parseDeckVerification({
        type: "legal",
        deck,
        ruleset: { id: "constructed", format: "Constructed", version: "2026-09-07" },
      }),
    ).toMatchObject({ type: "legal" });
    expect(
      parseDeckVerification({
        type: "illegal",
        deck,
        ruleset: { id: "constructed", format: "Constructed", version: "2026-09-07" },
        violations: [
          {
            type: "deckConstraint",
            rule: "mainDeckMinimum",
            message: "A constructed deck needs at least 40 cards.",
          },
        ],
      }),
    ).toMatchObject({ type: "illegal" });
  });
});
