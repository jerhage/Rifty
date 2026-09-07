import type { Deck, DeckEntry } from "@/features/deck/deck/deck";
import { riftboundStandard, verifyDeck } from "@/features/deck/deck/deck-legality";

import { deck } from "./fixtures";

const CHAMPION = "ogn-champion";

/**
 * A deck that satisfies every rule: 40 main across 14 distinct cards so no card exceeds three
 * copies, the chosen champion among them, 12 runes, 3 battlefields and a 10-card sideboard.
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
    { section: "chosenChampion", cardRiftboundId: CHAMPION, quantity: 1 },
    ...mainDeck,
    { section: "runeDeck", cardRiftboundId: "ogn-rune", quantity: 12 },
    { section: "battlefield", cardRiftboundId: "ogn-bf1", quantity: 1 },
    { section: "battlefield", cardRiftboundId: "ogn-bf2", quantity: 1 },
    { section: "battlefield", cardRiftboundId: "ogn-bf3", quantity: 1 },
    ...sideboard,
  ];
}

function withEntries(entries: DeckEntry[]): Deck {
  return deck("under-test", { entries });
}

function rulesBroken(entries: DeckEntry[]): string[] {
  const verification = verifyDeck(withEntries(entries), riftboundStandard);

  return verification.type === "illegal"
    ? verification.violations.map((violation) => violation.rule).sort()
    : [];
}

describe("deck legality", () => {
  it("accepts a deck that satisfies every zone", () => {
    const verification = verifyDeck(withEntries(legalEntries()), riftboundStandard);

    expect(verification).toEqual({
      type: "legal",
      deck: withEntries(legalEntries()),
      ruleset: riftboundStandard,
    });
  });

  it("reports every zone of an empty deck rather than stopping at the first", () => {
    expect(rulesBroken([])).toEqual([
      "battlefield-size",
      "chosenChampion-required",
      "legend-required",
      "mainDeck-size",
      "runeDeck-size",
      "sideboard-size",
    ]);
  });

  it("requires the chosen champion to also sit in the main deck", () => {
    const entries = legalEntries().filter(
      (entry) => !(entry.section === "mainDeck" && entry.cardRiftboundId === CHAMPION),
    );
    entries.push({ section: "mainDeck", cardRiftboundId: "ogn-swap", quantity: 3 });

    expect(rulesBroken(entries)).toEqual(["chosen-champion-in-main-deck"]);
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
    const verification = verifyDeck(withEntries(entries), riftboundStandard);

    expect(verification).toMatchObject({
      type: "illegal",
      violations: [{ type: "cardConstraint", cardRiftboundId: "ogn-bf1" }],
    });
  });
});
