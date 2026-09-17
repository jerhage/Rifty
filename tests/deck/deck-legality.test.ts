import { match } from "ts-pattern";

import type { ChosenChampion, DeckComposition, DeckLegalityRule } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";

import { taxonomyId } from "../card/fixtures";

import { cardId, deck, printingId, type DeckEntryInput } from "./fixtures";

const CHAMPION = "ogn-champion";
const CHAMPION_UNIT_KIND = { typeId: "Unit", supertypeId: taxonomyId("Champion") } as const;
const LEGEND_KIND = { typeId: "Legend", supertypeId: taxonomyId("Champion") } as const;

function champion(
  name: string,
  kind: Pick<ChosenChampion, "supertypeId" | "typeId"> = CHAMPION_UNIT_KIND,
): ChosenChampion {
  return { cardId: cardId(name), ...kind };
}

function entry(
  section: DeckEntryInput["section"],
  cardId: string,
  quantity: number,
  printingId: string = cardId,
): DeckEntryInput {
  return { section, cardId, printingId, quantity };
}

/**
 * A deck that satisfies every rule. The champion is a main deck card like any other, held at its
 * full allowance of three.
 */
function legalEntries(): DeckEntryInput[] {
  const mainDeck: DeckEntryInput[] = [
    entry("mainDeck", CHAMPION, 3),
    ...Array.from({ length: 12 }, (_unused, index) => entry("mainDeck", `ogn-main-${index}`, 3)),
    entry("mainDeck", "ogn-main-last", 1),
  ];
  const sideboard: DeckEntryInput[] = [
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

/** Judges what a stored deck holds, so the entries pass through the deck schema on the way in. */
function withEntries(
  entries: DeckEntryInput[],
  chosen: ChosenChampion | null = champion(CHAMPION),
): DeckComposition {
  const stored = deck("under-test", { entries, chosenChampionCardId: chosen?.cardId ?? null });

  return { entries: stored.entries, chosenChampion: chosen };
}

function compositionOf(
  entries: DeckEntryInput[],
  chosen: ChosenChampion | null = champion(CHAMPION),
): DeckComposition {
  return {
    entries: entries.map((held) => ({
      section: held.section,
      cardId: cardId(held.cardId),
      printingId: printingId(held.printingId),
      quantity: held.quantity,
    })),
    chosenChampion: chosen,
  };
}

function ruleLabel(rule: DeckLegalityRule): string {
  return match(rule)
    .with({ kind: "sectionRequired" }, ({ section }) => `${section}-required`)
    .with({ kind: "sectionSize" }, ({ section }) => `${section}-size`)
    .with({ kind: "sectionCopyLimit" }, ({ section }) => `${section}-copy-limit`)
    .with({ kind: "sharedCopyLimit" }, () => "shared-copy-limit")
    .with({ kind: "championRequired" }, () => "chosenChampion-required")
    .with({ kind: "championInMainDeck" }, () => "chosenChampion-in-main-deck")
    .with({ kind: "championIsChampionUnit" }, () => "chosenChampion-champion-unit")
    .exhaustive();
}

function rulesBroken(
  entries: DeckEntryInput[],
  chosen: ChosenChampion | null = champion(CHAMPION),
): string[] {
  const verification = verifyDeck(withEntries(entries, chosen), RIFTBOUND_STANDARD);

  return verification.type === "illegal"
    ? verification.violations.map((violation) => ruleLabel(violation.rule)).sort()
    : [];
}

describe("deck legality", () => {
  it("should accept a deck that satisfies every section", () => {
    const verification = verifyDeck(withEntries(legalEntries()), RIFTBOUND_STANDARD);

    expect(verification).toEqual({ type: "legal", ruleset: RIFTBOUND_STANDARD });
  });

  it("should judge composition supplied without a saved deck", () => {
    expect(verifyDeck(compositionOf(legalEntries()), RIFTBOUND_STANDARD)).toEqual({
      type: "legal",
      ruleset: RIFTBOUND_STANDARD,
    });
  });

  it("should report violations for composition supplied without a saved deck", () => {
    expect(verifyDeck(compositionOf([], null), RIFTBOUND_STANDARD)).toMatchObject({
      type: "illegal",
      ruleset: RIFTBOUND_STANDARD,
    });
  });

  it("should report every section of an empty deck rather than stopping at the first", () => {
    expect(rulesBroken([], null)).toEqual([
      "battlefield-size",
      "chosenChampion-required",
      "legend-required",
      "mainDeck-size",
      "runeDeck-size",
      "sideboard-size",
    ]);
  });

  it("should require the chosen champion to be one of the main deck's cards", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "mainDeck" && held.cardId === CHAMPION),
    );
    entries.push(entry("mainDeck", "ogn-swap", 3));

    expect(rulesBroken(entries)).toEqual(["chosenChampion-in-main-deck"]);
  });

  it("should reject a chosen champion that is not a champion unit", () => {
    expect(rulesBroken(legalEntries(), champion(CHAMPION, LEGEND_KIND))).toEqual([
      "chosenChampion-champion-unit",
    ]);
  });

  it("should judge rather than refuse a deck whose champion is the legend it already holds", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "mainDeck" && held.cardId === CHAMPION),
    );
    entries.push(entry("mainDeck", "ogn-swap", 3));
    const verification = verifyDeck(
      withEntries(entries, champion("ogn-legend", LEGEND_KIND)),
      RIFTBOUND_STANDARD,
    );

    expect(verification).toMatchObject({
      type: "illegal",
      violations: expect.arrayContaining([
        expect.objectContaining({
          type: "cardConstraint",
          cardId: "ogn-legend",
          rule: { kind: "championIsChampionUnit" },
        }),
      ]),
    });
  });

  it("should count the champion's copies against the shared limit like any other card", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "sideboard" && held.cardId === "ogn-side-last"),
    );
    // Three in the main deck plus one in the sideboard is one copy too many.
    entries.push(entry("sideboard", CHAMPION, 1));

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("should count main deck and sideboard copies against one shared limit", () => {
    const entries = legalEntries();
    // ogn-main-0 already holds its full three copies in the main deck.
    entries.push(entry("sideboard", "ogn-main-0", 1));
    const filler = entries.find(
      (held) => held.section === "sideboard" && held.cardId === "ogn-side-last",
    );
    if (filler) entries.splice(entries.indexOf(filler), 1);

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("should accept twelve copies of one rune in the rune deck", () => {
    const entries = legalEntries().filter((held) => held.section !== "runeDeck");
    entries.push(entry("runeDeck", "ogn-rune-solo", 12));

    expect(rulesBroken(entries)).toEqual([]);
  });

  it("should allow only one copy of each battlefield", () => {
    const entries = legalEntries().filter((held) => held.section !== "battlefield");
    entries.push(entry("battlefield", "ogn-bf1", 3));

    expect(rulesBroken(entries)).toEqual(["battlefield-copy-limit"]);
  });

  it("should reject a second legend", () => {
    const entries = legalEntries();
    entries.push(entry("legend", "ogn-legend-2", 1));

    expect(rulesBroken(entries)).toEqual(["legend-required"]);
  });

  it("should name the offending card and its printings on a copy-limit violation", () => {
    const entries = legalEntries().filter((held) => held.section !== "battlefield");
    entries.push(entry("battlefield", "ogn-bf1", 3));
    const verification = verifyDeck(withEntries(entries), RIFTBOUND_STANDARD);

    expect(verification).toMatchObject({
      type: "illegal",
      violations: [{ type: "cardConstraint", cardId: "ogn-bf1", printingIds: ["ogn-bf1"] }],
    });
  });

  it("should count copies of a card across all of its printings", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "sideboard" && held.cardId === "ogn-side-last"),
    );
    entries.push(entry("sideboard", "ogn-main-0", 1, "ogn-main-0a"));

    expect(rulesBroken(entries)).toEqual(["shared-copy-limit"]);
  });

  it("should reject a fourth copy of a card split across two printings of it", () => {
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
          rule: { kind: "sharedCopyLimit" },
        },
      ],
    });
  });

  it("should allow a card's three copies to be split across its printings", () => {
    const entries = legalEntries().filter(
      (held) => !(held.section === "mainDeck" && held.cardId === "ogn-main-0"),
    );
    entries.push(entry("mainDeck", "ogn-main-0", 2));
    entries.push(entry("mainDeck", "ogn-main-0", 1, "ogn-main-0a"));

    expect(rulesBroken(entries)).toEqual([]);
  });

  it("should allow only one copy of a battlefield however its printings are mixed", () => {
    const entries = legalEntries().filter((held) => held.section !== "battlefield");
    entries.push(entry("battlefield", "ogn-bf1", 1));
    entries.push(entry("battlefield", "ogn-bf1", 1, "ogn-bf1a"));
    entries.push(entry("battlefield", "ogn-bf2", 1));

    expect(rulesBroken(entries)).toEqual(["battlefield-copy-limit"]);
  });
});
