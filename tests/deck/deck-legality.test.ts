import type { Deck, DeckEntry } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";

import { deck } from "./fixtures";

const CHAMPION = "ogn-champion";

function entry(
  section: DeckEntry["section"],
  cardId: string,
  quantity: number,
  printingId: string = cardId,
): DeckEntry {
  return { section, cardId, printingId, quantity };
}

/**
 * A deck that satisfies every rule. The champion is a main deck card like any other, held at its
 * full allowance of three.
 */
function legalEntries(): DeckEntry[] {
  const mainDeck: DeckEntry[] = [
    entry("mainDeck", CHAMPION, 3),
    ...Array.from({ length: 12 }, (_unused, index) => entry("mainDeck", `ogn-main-${index}`, 3)),
    entry("mainDeck", "ogn-main-last", 1),
  ];
  const sideboard: DeckEntry[] = [
    ...Array.from({ length: 3 }, (_unused, index) => entry("sideboard", `ogn-side-${index}`, 3)),
    entry("sideboard", "ogn-side-last", 1),
  ];

  return [
    entry("legend", "ogn-legend", 1),
    ...mainDeck,
    entry("runeDeck", "ogn-rune", 12),
    entry("battlefield", "ogn-bf1", 1),
    entry("battlefield", "ogn-bf2", 1),
    entry("battlefield", "ogn-bf3", 1),
    ...sideboard,
  ];
}

function withEntries(entries: DeckEntry[], champion: string | null = CHAMPION): Deck {
  return deck("under-test", { entries, chosenChampionCardId: champion });
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
      (held) => !(held.section === "mainDeck" && held.cardId === CHAMPION),
    );
    entries.push(entry("mainDeck", "ogn-swap", 3));

    expect(rulesBroken(entries)).toEqual(["chosenChampion-in-main-deck"]);
  });

  it("counts the champion's copies against the shared limit like any other card", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "sideboard" && held.cardId === "ogn-side-last"),
    );
    // Three in the main deck plus one in the sideboard is one copy too many.
    entries.push(entry("sideboard", CHAMPION, 1));

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("counts main deck and sideboard copies against one shared limit", () => {
    const entries = legalEntries();
    // ogn-main-0 already holds its full three copies in the main deck.
    entries.push(entry("sideboard", "ogn-main-0", 1));
    const filler = entries.find(
      (held) => held.section === "sideboard" && held.cardId === "ogn-side-last",
    );
    if (filler) entries.splice(entries.indexOf(filler), 1);

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("allows the rune deck any number of copies", () => {
    const entries = legalEntries();

    expect(rulesBroken(entries)).toEqual([]);
  });

  it("allows only one copy of each battlefield", () => {
    const entries = legalEntries().filter((held) => held.section !== "battlefield");
    entries.push(entry("battlefield", "ogn-bf1", 3));

    expect(rulesBroken(entries)).toEqual(["battlefield-copy-limit"]);
  });

  it("rejects a second legend", () => {
    const entries = legalEntries();
    entries.push(entry("legend", "ogn-legend-2", 1));

    expect(rulesBroken(entries)).toEqual(["legend-required"]);
  });

  it("names the offending card and its printings on a copy-limit violation", () => {
    const entries = legalEntries().filter((held) => held.section !== "battlefield");
    entries.push(entry("battlefield", "ogn-bf1", 3));
    const verification = verifyDeck(withEntries(entries), RIFTBOUND_STANDARD);

    expect(verification).toMatchObject({
      type: "illegal",
      violations: [{ type: "cardConstraint", cardId: "ogn-bf1", printingIds: ["ogn-bf1"] }],
    });
  });

  it("counts copies of a card across all of its printings", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "sideboard" && held.cardId === "ogn-side-last"),
    );
    entries.push(entry("sideboard", "ogn-main-0", 1, "ogn-main-0a"));

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("rejects a fourth copy of a card split across two printings of it", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "mainDeck" && held.cardId === "ogn-main-last"),
    );
    entries.push(entry("mainDeck", "ogn-main-0", 1, "ogn-main-0a"));
    const verification = verifyDeck(withEntries(entries), RIFTBOUND_STANDARD);

    expect(verification).toMatchObject({
      type: "illegal",
      violations: [
        {
          type: "cardConstraint",
          cardId: "ogn-main-0",
          printingIds: ["ogn-main-0", "ogn-main-0a"],
          rule: "shared-copy-limit",
        },
      ],
    });
  });

  it("allows a card's three copies to be split across its printings", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "mainDeck" && held.cardId === "ogn-main-0"),
    );
    entries.push(entry("mainDeck", "ogn-main-0", 2));
    entries.push(entry("mainDeck", "ogn-main-0", 1, "ogn-main-0a"));

    expect(rulesBroken(entries)).toEqual([]);
  });

  it("allows only one copy of a battlefield however its printings are mixed", () => {
    const entries = legalEntries().filter((held) => held.section !== "battlefield");
    entries.push(entry("battlefield", "ogn-bf1", 1));
    entries.push(entry("battlefield", "ogn-bf1", 1, "ogn-bf1a"));
    entries.push(entry("battlefield", "ogn-bf2", 1));

    expect(rulesBroken(entries)).toEqual(["battlefield-copy-limit"]);
  });
});
