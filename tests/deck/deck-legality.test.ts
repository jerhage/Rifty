import type { Deck, DeckEntry } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";

import { deck } from "./fixtures";

const CHAMPION = "ogn-champion";

/**
 * A deck that satisfies every rule. The champion is a main deck card like any other, held at its
 * full allowance of three.
 */
function legalEntries(): DeckEntry[] {
  const mainDeck: DeckEntry[] = [
    { section: "mainDeck", cardRiftboundId: CHAMPION, quantity: 3 },
    ...Array.from({ length: 12 }, (_unused, index) => ({
      section: "mainDeck" as const,
      cardRiftboundId: `ogn-main-${index}`,
      quantity: 3,
    })),
    { section: "mainDeck", cardRiftboundId: "ogn-main-last", quantity: 1 },
  ];
  const sideboard: DeckEntry[] = [
    ...Array.from({ length: 3 }, (_unused, index) => ({
      section: "sideboard" as const,
      cardRiftboundId: `ogn-side-${index}`,
      quantity: 3,
    })),
    { section: "sideboard", cardRiftboundId: "ogn-side-last", quantity: 1 },
  ];

  return [
    { section: "legend", cardRiftboundId: "ogn-legend", quantity: 1 },
    ...mainDeck,
    { section: "runeDeck", cardRiftboundId: "ogn-rune", quantity: 12 },
    { section: "battlefield", cardRiftboundId: "ogn-bf1", quantity: 1 },
    { section: "battlefield", cardRiftboundId: "ogn-bf2", quantity: 1 },
    { section: "battlefield", cardRiftboundId: "ogn-bf3", quantity: 1 },
    ...sideboard,
  ];
}

function withEntries(entries: DeckEntry[], champion: string | null = CHAMPION): Deck {
  return deck("under-test", { entries, chosenChampionRiftboundId: champion });
}

function rulesBroken(entries: DeckEntry[], champion: string | null = CHAMPION): string[] {
  const verification = verifyDeck(withEntries(entries, champion), RIFTBOUND_STANDARD);

  return verification.type === "illegal"
    ? verification.violations.map((violation) => violation.rule).sort()
    : [];
}

describe("deck legality", () => {
  it("accepts a deck that satisfies every zone", () => {
    const verification = verifyDeck(withEntries(legalEntries()), RIFTBOUND_STANDARD);

    expect(verification).toEqual({
      type: "legal",
      deck: withEntries(legalEntries()),
      ruleset: RIFTBOUND_STANDARD,
    });
  });

  it("reports every zone of an empty deck rather than stopping at the first", () => {
    expect(rulesBroken([], null)).toEqual([
      "battlefield-size",
      "chosenChampion-required",
      "legend-required",
      "mainDeck-size",
      "runeDeck-size",
      "sideboard-size",
    ]);
  });

  it("requires the chosen champion to be one of the main deck's cards", () => {
    const entries = legalEntries().filter(
      (entry) => !(entry.section === "mainDeck" && entry.cardRiftboundId === CHAMPION),
    );
    entries.push({ section: "mainDeck", cardRiftboundId: "ogn-swap", quantity: 3 });

    expect(rulesBroken(entries)).toEqual(["chosenChampion-in-main-deck"]);
  });

  it("counts the champion's copies against the shared limit like any other card", () => {
    const entries = legalEntries().filter(
      (entry) => !(entry.section === "sideboard" && entry.cardRiftboundId === "ogn-side-last"),
    );
    // Three in the main deck plus one in the sideboard is one copy too many.
    entries.push({ section: "sideboard", cardRiftboundId: CHAMPION, quantity: 1 });

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("counts main deck and sideboard copies against one shared limit", () => {
    const entries = legalEntries();
    // ogn-main-0 already holds its full three copies in the main deck.
    entries.push({ section: "sideboard", cardRiftboundId: "ogn-main-0", quantity: 1 });
    const filler = entries.find(
      (entry) => entry.section === "sideboard" && entry.cardRiftboundId === "ogn-side-last",
    );
    if (filler) entries.splice(entries.indexOf(filler), 1);

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("allows the rune deck any number of copies", () => {
    const entries = legalEntries();

    expect(rulesBroken(entries)).toEqual([]);
  });

  it("allows only one copy of each battlefield", () => {
    const entries = legalEntries().filter((entry) => entry.section !== "battlefield");
    entries.push({ section: "battlefield", cardRiftboundId: "ogn-bf1", quantity: 3 });

    expect(rulesBroken(entries)).toEqual(["battlefield-copy-limit"]);
  });

  it("rejects a second legend", () => {
    const entries = legalEntries();
    entries.push({ section: "legend", cardRiftboundId: "ogn-legend-2", quantity: 1 });

    expect(rulesBroken(entries)).toEqual(["legend-required"]);
  });

  it("names the offending card on a copy-limit violation", () => {
    const entries = legalEntries().filter((entry) => entry.section !== "battlefield");
    entries.push({ section: "battlefield", cardRiftboundId: "ogn-bf1", quantity: 3 });
    const verification = verifyDeck(withEntries(entries), RIFTBOUND_STANDARD);

    expect(verification).toMatchObject({
      type: "illegal",
      violations: [{ type: "cardConstraint", cardRiftboundId: "ogn-bf1" }],
    });
  });
});
