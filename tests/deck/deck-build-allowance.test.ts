import type { Card } from "@/features/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";
import {
  lockedCopies,
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

const survivor = card("survivor", "OGN", { name: "Kai'Sa - Survivor" });
const survivorAlt = card("survivor-alt", "OGN", { name: "Kai'Sa - Survivor (Alternate Art)" });
const evolutionary = card("evolutionary", "OGN", { name: "Kai'Sa - Evolutionary" });
const rune = card("rune", "OGN", { name: "Fury Rune" });

type Placement = readonly [DeckSection, Card, number];

function draftWith(...placements: readonly Placement[]): DeckBuildDraft {
  return placements.reduce<DeckBuildDraft>(
    (draft, [section, placed, quantity]) =>
      withZoneCard(draft, section, placed.printingId, { card: placed, quantity }),
    EMPTY_DRAFT,
  );
}

describe("deck build allowance", () => {
  it("counts printings of the same card against one allowance", () => {
    const draft = draftWith(["mainDeck", survivor, 3]);

    expect(lockedCopies(draft, "mainDeck", survivorAlt)).toBe(3);
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toBe(0);
  });

  it("keeps different cards apart even when they share a character", () => {
    const draft = draftWith(["mainDeck", survivor, 3]);

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toBe(3);
  });

  it("seats the chosen champion in the main deck as an ordinary card", () => {
    const draft = chooseChampion(EMPTY_DRAFT, survivor);

    expect(zoneCounts(draft).mainDeck).toBe(1);
    expect(quantityOf(draft, "mainDeck", survivor.printingId)).toBe(1);
    expect(quantityOf(draft, "mainDeck", survivorAlt.printingId)).toBe(0);
  });

  it("keeps the copies already held when a card becomes the champion", () => {
    const draft = chooseChampion(draftWith(["mainDeck", survivor, 3]), survivor);

    expect(quantityOf(draft, "mainDeck", survivor.printingId)).toBe(3);
  });

  it("holds the chosen champion's own printing at one copy in the main deck", () => {
    const draft = chooseChampion(EMPTY_DRAFT, survivor);

    expect(minimumForCard(draft, "mainDeck", survivor)).toBe(1);
    expect(minimumForCard(draft, "mainDeck", survivorAlt)).toBe(0);
    expect(minimumForCard(draft, "sideboard", survivor)).toBe(0);
    expect(minimumForCard(EMPTY_DRAFT, "mainDeck", survivor)).toBe(0);
  });

  it("counts the champion's seated copy against its other printings", () => {
    const draft = chooseChampion(EMPTY_DRAFT, survivor);

    expect(lockedCopies(draft, "mainDeck", survivorAlt)).toBe(1);
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toBe(2);
  });

  it("counts the sideboard against the main deck", () => {
    const draft = draftWith(["sideboard", survivorAlt, 2]);

    expect(remainingForCard(draft, "mainDeck", survivor)).toBe(1);
  });

  it("ignores the zone's own copies, which the stepper already owns", () => {
    const draft = draftWith(["mainDeck", survivor, 2]);

    expect(lockedCopies(draft, "mainDeck", survivor)).toBe(0);
    expect(remainingForCard(draft, "mainDeck", survivor)).toBe(3);
  });

  it("allows a mix of printings up to the shared limit", () => {
    const draft = draftWith(["mainDeck", survivor, 2], ["mainDeck", survivorAlt, 1]);

    // Two regular plus one alternate art is the full allowance, so neither row takes another.
    expect(remainingForCard(draft, "mainDeck", survivor)).toBe(2);
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toBe(1);
  });

  it("lets the main deck run past its target", () => {
    const draft = draftWith(
      ...Array.from(
        { length: 20 },
        (_unused, index): Placement => [
          "mainDeck",
          card(`filler-${index}`, "OGN", { name: `Filler ${index}` }),
          3,
        ],
      ),
    );

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toBe(3);
  });

  it("stops the rune deck at twelve cards", () => {
    const other = card("other-rune", "OGN", { name: "Calm Rune" });
    const draft = draftWith(["runeDeck", other, 10]);

    expect(remainingForCard(draft, "runeDeck", rune)).toBe(2);
  });

  it("counts a rune's own copies against the twelve, not against itself twice", () => {
    const draft = draftWith(["runeDeck", rune, 12]);

    expect(remainingForCard(draft, "runeDeck", rune)).toBe(12);
  });

  it("offers the full rune deck when it is empty", () => {
    expect(remainingForCard(EMPTY_DRAFT, "runeDeck", rune)).toBe(12);
  });

  it("allows one copy of a battlefield", () => {
    expect(remainingForCard(EMPTY_DRAFT, "battlefield", rune)).toBe(1);
  });
});
