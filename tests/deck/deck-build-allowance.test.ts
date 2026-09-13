import type { Card } from "@/features/card/card";
import type { ZoneSection } from "@/features/deck/deck/deck-legality";
import {
  minimumForCard,
  remainingForCard,
} from "@/features/deck/presentation/deck-build-allowance";
import {
  chooseChampion,
  EMPTY_DRAFT,
  quantityOf,
  withZoneCard,
  zoneCounts,
  type DeckBuildDraft,
} from "@/features/deck/presentation/deck-build-steps";

import { card } from "../card/fixtures";

const CHAMPION_CLASSIFICATION = {
  typeId: "Unit",
  supertypeId: "Champion",
  rarityId: "rare",
} as const;

const survivor = card("survivor", "OGN", {
  name: "Kai'Sa - Survivor",
  classification: CHAMPION_CLASSIFICATION,
});
const survivorAlt = card("survivor-alt", "OGN", {
  name: "Kai'Sa - Survivor (Alternate Art)",
  classification: CHAMPION_CLASSIFICATION,
});
const evolutionary = card("evolutionary", "OGN", { name: "Kai'Sa - Evolutionary" });
const rune = card("rune", "OGN", { name: "Fury Rune" });

type Placement = readonly [ZoneSection, Card, number];

function draftWith(...placements: readonly Placement[]): DeckBuildDraft {
  return placements.reduce<DeckBuildDraft>(
    (draft, [section, placed, quantity]) =>
      withZoneCard(draft, section, placed.printingId, { card: placed, quantity }),
    EMPTY_DRAFT,
  );
}

describe("deck build allowance", () => {
  it("should count printings of the same card against one allowance", () => {
    const draft = draftWith(["mainDeck", survivor, 3]);

    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toEqual({
      type: "limited",
      copies: 0,
    });
  });

  it("should keep different cards apart even when they share a character", () => {
    const draft = draftWith(["mainDeck", survivor, 3]);

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toEqual({
      type: "limited",
      copies: 3,
    });
  });

  it("should seat the chosen champion in the main deck as an ordinary card", () => {
    const draft = chooseChampion(EMPTY_DRAFT, survivor);

    expect(zoneCounts(draft).mainDeck).toBe(1);
    expect(quantityOf(draft, "mainDeck", survivor.printingId)).toBe(1);
    expect(quantityOf(draft, "mainDeck", survivorAlt.printingId)).toBe(0);
  });

  it("should keep the copies already held when a card becomes the champion", () => {
    const draft = chooseChampion(draftWith(["mainDeck", survivor, 3]), survivor);

    expect(quantityOf(draft, "mainDeck", survivor.printingId)).toBe(3);
  });

  it("should hold the chosen champion's own printing at one copy in the main deck", () => {
    const draft = chooseChampion(EMPTY_DRAFT, survivor);

    expect(minimumForCard(draft, "mainDeck", survivor)).toBe(1);
    expect(minimumForCard(draft, "mainDeck", survivorAlt)).toBe(0);
    expect(minimumForCard(draft, "sideboard", survivor)).toBe(0);
    expect(minimumForCard(EMPTY_DRAFT, "mainDeck", survivor)).toBe(0);
  });

  it("should count the champion's seated copy against its other printings", () => {
    const draft = chooseChampion(EMPTY_DRAFT, survivor);

    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toEqual({
      type: "limited",
      copies: 2,
    });
  });

  it("should count the sideboard against the main deck", () => {
    const draft = draftWith(["sideboard", survivorAlt, 2]);

    expect(remainingForCard(draft, "mainDeck", survivor)).toEqual({ type: "limited", copies: 1 });
  });

  it("should refuse a fourth copy split across the main deck and the sideboard", () => {
    const draft = draftWith(["mainDeck", survivor, 2], ["sideboard", survivorAlt, 1]);

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toEqual({
      type: "limited",
      copies: 3,
    });
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toEqual({
      type: "limited",
      copies: 0,
    });
    expect(remainingForCard(draft, "sideboard", survivorAlt)).toEqual({
      type: "limited",
      copies: 1,
    });
    expect(
      remainingForCard(draftWith(["sideboard", survivorAlt, 3]), "mainDeck", survivor),
    ).toEqual({ type: "limited", copies: 0 });
  });

  it("should ignore the zone's own copies, which the stepper already owns", () => {
    const draft = draftWith(["mainDeck", survivor, 2]);

    expect(remainingForCard(draft, "mainDeck", survivor)).toEqual({ type: "limited", copies: 3 });
  });

  it("should allow a mix of printings up to the shared limit", () => {
    const draft = draftWith(["mainDeck", survivor, 2], ["mainDeck", survivorAlt, 1]);

    // Two regular plus one alternate art is the full allowance, so neither row takes another.
    expect(remainingForCard(draft, "mainDeck", survivor)).toEqual({ type: "limited", copies: 2 });
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toEqual({
      type: "limited",
      copies: 1,
    });
  });

  it("should let the main deck run past its target", () => {
    const draft = draftWith(
      ...Array.from({ length: 20 }, (_unused, index): Placement => [
        "mainDeck",
        card(`filler-${index}`, "OGN", { name: `Filler ${index}` }),
        3,
      ]),
    );

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toEqual({
      type: "limited",
      copies: 3,
    });
  });

  it("should stop the rune deck at twelve cards", () => {
    const other = card("other-rune", "OGN", { name: "Calm Rune" });
    const draft = draftWith(["runeDeck", other, 10]);

    expect(remainingForCard(draft, "runeDeck", rune)).toEqual({ type: "limited", copies: 2 });
  });

  it("should count a rune's own copies against the twelve, not against itself twice", () => {
    const draft = draftWith(["runeDeck", rune, 12]);

    expect(remainingForCard(draft, "runeDeck", rune)).toEqual({ type: "limited", copies: 12 });
  });

  it("should offer the full rune deck when it is empty", () => {
    expect(remainingForCard(EMPTY_DRAFT, "runeDeck", rune)).toEqual({
      type: "limited",
      copies: 12,
    });
  });

  it("should allow one copy of a battlefield", () => {
    expect(remainingForCard(EMPTY_DRAFT, "battlefield", rune)).toEqual({
      type: "limited",
      copies: 1,
    });
  });
});
