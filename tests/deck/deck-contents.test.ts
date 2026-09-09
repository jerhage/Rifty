import {
  deckGroups,
  energyCurve,
  keywordMix,
  speedMix,
} from "@/features/deck/presentation/deck-contents";

import { card } from "../catalog/fixtures";
import { deck } from "./fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const cheap = card("cheap", "OGN", {
  name: "Cheap Unit",
  keywords: [{ id: "shield", name: "Shield", value: 2 }],
  attributes: { energy: 1, might: 1, power: null },
  tagIds: ["Volibear", "Freljord"],
});
const mid = card("mid", "OGN", {
  name: "Mid Spell",
  speeds: ["action", "reaction"],
  keywords: [
    { id: "tank", name: "Tank", value: null },
    { id: "reaction", name: "Reaction", value: null },
    { id: "equip", name: "Equip", value: null },
  ],
  attributes: { energy: 3, might: null, power: null },
  classification: { typeId: "Spell", supertypeId: null, rarityId: "common" },
  tagIds: ["Freljord"],
});
const champion = card("champion", "OGN", {
  name: "Volibear - Furious",
  attributes: { energy: 2, might: 4, power: null },
  tagIds: [],
});
const big = card("big", "OGN", {
  name: "Big Unit",
  attributes: { energy: 7, might: 8, power: null },
  tagIds: [],
});

const cards = [legend, champion, cheap, mid, big];
const built = deck("d1", {
  chosenChampionRiftboundId: champion.riftboundId,
  entries: [
    { section: "legend", cardRiftboundId: legend.riftboundId, quantity: 1 },
    { section: "mainDeck", cardRiftboundId: champion.riftboundId, quantity: 1 },
    { section: "mainDeck", cardRiftboundId: cheap.riftboundId, quantity: 3 },
    { section: "mainDeck", cardRiftboundId: mid.riftboundId, quantity: 2 },
    { section: "sideboard", cardRiftboundId: big.riftboundId, quantity: 1 },
  ],
});

describe("deck contents", () => {
  it("splits the main deck by card type and keeps other zones apart", () => {
    expect(deckGroups(built, cards).map((group) => [group.title, group.count])).toEqual([
      ["Legend", 1],
      ["Units", 4],
      ["Spells & Gear", 2],
      ["Sideboard", 1],
    ]);
  });

  it("drops entries whose card is missing from the catalog", () => {
    expect(deckGroups(built, [cheap]).map((group) => group.title)).toEqual(["Units"]);
  });

  it("curves the main deck, leaving other zones out", () => {
    expect(energyCurve(built, cards)).toEqual([
      { label: "0-1", count: 3 },
      { label: "2", count: 1 },
      { label: "3", count: 2 },
      { label: "4", count: 0 },
      { label: "5+", count: 0 },
    ]);
  });

  it("counts a card at every speed it can be played, so shares can pass the deck size", () => {
    expect(speedMix(built, cards)).toEqual([
      { speed: "normal", count: 4, share: 4 / 6 },
      { speed: "action", count: 2, share: 2 / 6 },
      { speed: "reaction", count: 2, share: 2 / 6 },
    ]);
  });

  it("tallies keywords by copies held, most common first, and sums their values", () => {
    expect(keywordMix(built, cards)).toEqual({
      carrying: 5,
      keywords: [
        { id: "shield", name: "Shield", count: 3, totalValue: 6 },
        { id: "tank", name: "Tank", count: 2, totalValue: null },
      ],
    });
  });

  it("leaves out the keywords excluded from this analysis", () => {
    const shown = keywordMix(built, cards).keywords.map((keyword) => keyword.id);

    expect(shown).not.toContain("reaction");
    expect(shown).not.toContain("equip");
    expect(shown).toContain("tank");
  });

  it("counts a keyword only where the deck actually plays the card", () => {
    expect(keywordMix(deck("empty", { entries: [] }), cards)).toEqual({
      carrying: 0,
      keywords: [],
    });
  });
});
