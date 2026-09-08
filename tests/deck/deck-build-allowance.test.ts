import {
  displayedCopies,
  lockedCopies,
  remainingForCard,
} from "@/features/deck/presentation/deck-build-allowance";
import {
  emptyDraft,
  quantityKey,
  zoneCounts,
  type DeckBuildDraft,
} from "@/features/deck/presentation/deck-build-steps";

import { card } from "../catalog/fixtures";

const survivor = card("survivor", "OGN", { name: "Kai'Sa - Survivor" });
const survivorAlt = card("survivor-alt", "OGN", { name: "Kai'Sa - Survivor (Alternate Art)" });
const evolutionary = card("evolutionary", "OGN", { name: "Kai'Sa - Evolutionary" });
const rune = card("rune", "OGN", { name: "Fury Rune" });

function draftWith(overrides: Partial<DeckBuildDraft>): DeckBuildDraft {
  return { ...emptyDraft, ...overrides };
}

describe("deck build allowance", () => {
  it("counts printings of the same card against one allowance", () => {
    const draft = draftWith({
      zoneCards: {
        [quantityKey("mainDeck", survivor.riftboundId)]: { card: survivor, quantity: 3 },
      },
    });

    expect(lockedCopies(draft, "mainDeck", survivorAlt)).toBe(3);
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toBe(0);
  });

  it("keeps different cards apart even when they share a character", () => {
    const draft = draftWith({
      zoneCards: {
        [quantityKey("mainDeck", survivor.riftboundId)]: { card: survivor, quantity: 3 },
      },
    });

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toBe(3);
  });

  it("counts the chosen champion against the main deck, across printings", () => {
    const draft = draftWith({ chosenChampion: survivor });

    expect(lockedCopies(draft, "mainDeck", survivor)).toBe(1);
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toBe(2);
  });

  it("seats the chosen champion in the main deck", () => {
    const draft = draftWith({ chosenChampion: survivor });

    expect(zoneCounts(draft).mainDeck).toBe(1);
    expect(displayedCopies(draft, "mainDeck", survivor)).toBe(1);
    expect(displayedCopies(draft, "mainDeck", survivorAlt)).toBe(0);
  });

  it("splits the champion's remaining two copies across its printings", () => {
    const withChampion = draftWith({ chosenChampion: survivor });
    // Nothing is in the main deck yet, so either printing may take the two that are left.
    expect(remainingForCard(withChampion, "mainDeck", survivor)).toBe(2);
    expect(remainingForCard(withChampion, "mainDeck", survivorAlt)).toBe(2);

    const withOneRegular = draftWith({
      chosenChampion: survivor,
      zoneCards: {
        [quantityKey("mainDeck", survivor.riftboundId)]: { card: survivor, quantity: 1 },
      },
    });
    expect(remainingForCard(withOneRegular, "mainDeck", survivorAlt)).toBe(1);

    const withTwoRegular = draftWith({
      chosenChampion: survivor,
      zoneCards: {
        [quantityKey("mainDeck", survivor.riftboundId)]: { card: survivor, quantity: 2 },
      },
    });
    expect(remainingForCard(withTwoRegular, "mainDeck", survivorAlt)).toBe(0);
  });

  it("counts the sideboard against the main deck", () => {
    const draft = draftWith({
      zoneCards: {
        [quantityKey("sideboard", survivorAlt.riftboundId)]: { card: survivorAlt, quantity: 2 },
      },
    });

    expect(remainingForCard(draft, "mainDeck", survivor)).toBe(1);
  });

  it("ignores the zone's own copies, which the stepper already owns", () => {
    const draft = draftWith({
      zoneCards: {
        [quantityKey("mainDeck", survivor.riftboundId)]: { card: survivor, quantity: 2 },
      },
    });

    expect(lockedCopies(draft, "mainDeck", survivor)).toBe(0);
    expect(remainingForCard(draft, "mainDeck", survivor)).toBe(3);
  });

  it("allows a mix of printings up to the shared limit", () => {
    const draft = draftWith({
      zoneCards: {
        [quantityKey("mainDeck", survivor.riftboundId)]: { card: survivor, quantity: 2 },
        [quantityKey("mainDeck", survivorAlt.riftboundId)]: { card: survivorAlt, quantity: 1 },
      },
    });

    // Two regular plus one alternate art is the full allowance, so neither row takes another.
    expect(remainingForCard(draft, "mainDeck", survivor)).toBe(2);
    expect(remainingForCard(draft, "mainDeck", survivorAlt)).toBe(1);
  });

  it("lets the main deck run past its target", () => {
    const draft = draftWith({
      zoneCards: Object.fromEntries(
        Array.from({ length: 20 }, (_unused, index) => {
          const filler = card(`filler-${index}`, "OGN", { name: `Filler ${index}` });
          return [quantityKey("mainDeck", filler.riftboundId), { card: filler, quantity: 3 }];
        }),
      ),
    });

    expect(remainingForCard(draft, "mainDeck", evolutionary)).toBe(3);
  });

  it("stops the rune deck at twelve cards", () => {
    const other = card("other-rune", "OGN", { name: "Calm Rune" });
    const draft = draftWith({
      zoneCards: {
        [quantityKey("runeDeck", other.riftboundId)]: { card: other, quantity: 10 },
      },
    });

    expect(remainingForCard(draft, "runeDeck", rune)).toBe(2);
  });

  it("counts a rune's own copies against the twelve, not against itself twice", () => {
    const draft = draftWith({
      zoneCards: {
        [quantityKey("runeDeck", rune.riftboundId)]: { card: rune, quantity: 12 },
      },
    });

    expect(remainingForCard(draft, "runeDeck", rune)).toBe(12);
  });

  it("offers the full rune deck when it is empty", () => {
    expect(remainingForCard(emptyDraft, "runeDeck", rune)).toBe(12);
  });

  it("allows one copy of a battlefield", () => {
    expect(remainingForCard(emptyDraft, "battlefield", rune)).toBe(1);
  });
});
