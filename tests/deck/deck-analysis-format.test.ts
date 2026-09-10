import { deckAnalysis } from "@/features/deck/presentation/deck-analysis-format";

import { card, carriedKeyword } from "../card/fixtures";
import { deck } from "./fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  speeds: ["reaction"],
  keywords: [carriedKeyword("vision", "Vision")],
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const cheap = card("cheap", "OGN", {
  name: "Cheap Unit",
  keywords: [carriedKeyword("shield", "Shield", 2)],
  attributes: { energy: 1, might: 1, power: null },
});
const mid = card("mid", "OGN", {
  name: "Mid Spell",
  speeds: ["action"],
  attributes: { energy: 3, might: null, power: null },
  classification: { typeId: "Spell", supertypeId: null, rarityId: "common" },
});
const rune = card("rune", "OGN", {
  name: "Power Rune",
  attributes: { energy: 2, might: null, power: null },
  classification: { typeId: "Rune", supertypeId: null, rarityId: "common" },
});
const bench = card("bench", "OGN", {
  name: "Sideboard Giant",
  keywords: [carriedKeyword("tank", "Tank")],
  attributes: { energy: 5, might: 5, power: null },
});

const cards = [legend, cheap, mid, rune, bench];
const built = deck("d1", {
  entries: [
    { section: "legend", cardId: legend.cardId, printingId: legend.printingId, quantity: 1 },
    { section: "mainDeck", cardId: cheap.cardId, printingId: cheap.printingId, quantity: 3 },
    { section: "mainDeck", cardId: mid.cardId, printingId: mid.printingId, quantity: 2 },
    { section: "runeDeck", cardId: rune.cardId, printingId: rune.printingId, quantity: 4 },
    { section: "sideboard", cardId: bench.cardId, printingId: bench.printingId, quantity: 1 },
  ],
});

describe("deck analysis", () => {
  it("should build the energy curve from the main deck alone", () => {
    expect(deckAnalysis(built, cards).energyBuckets).toEqual([
      { label: "0-1", count: 3 },
      { label: "2", count: 0 },
      { label: "3", count: 2 },
      { label: "4", count: 0 },
      { label: "5+", count: 0 },
    ]);
  });

  it("should count ability cards across the legend and the main deck", () => {
    expect(deckAnalysis(built, cards).abilityCards).toBe(6);
  });

  it("should mix speeds across the legend and the main deck", () => {
    expect(deckAnalysis(built, cards).speeds).toEqual([
      { speed: "normal", count: 3, share: 3 / 6 },
      { speed: "action", count: 2, share: 2 / 6 },
      { speed: "reaction", count: 1, share: 1 / 6 },
    ]);
  });

  it("should tally the keywords the legend and the main deck carry", () => {
    expect(deckAnalysis(built, cards).keywords).toEqual({
      carrying: 4,
      keywords: [
        { id: "shield", name: "Shield", count: 3, totalValue: 6 },
        { id: "vision", name: "Vision", count: 1, totalValue: null },
      ],
    });
  });

  it("should measure nothing when no entry resolves to a card", () => {
    expect(deckAnalysis(built, [])).toEqual({
      abilityCards: 0,
      energyBuckets: [
        { label: "0-1", count: 0 },
        { label: "2", count: 0 },
        { label: "3", count: 0 },
        { label: "4", count: 0 },
        { label: "5+", count: 0 },
      ],
      keywords: { carrying: 0, keywords: [] },
      speeds: [
        { speed: "normal", count: 0, share: 0 },
        { speed: "action", count: 0, share: 0 },
        { speed: "reaction", count: 0, share: 0 },
      ],
    });
  });
});
