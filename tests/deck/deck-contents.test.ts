import { deckGroups } from "@/features/deck/presentation/deck-contents";

import { card } from "../catalog/fixtures";
import { deck } from "./fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  speeds: ["reaction"],
  keywords: [{ id: "vision", name: "Vision", scope: "self", value: null }],
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const cheap = card("cheap", "OGN", {
  name: "Cheap Unit",
  keywords: [{ id: "shield", name: "Shield", scope: "self", value: 2 }],
  attributes: { energy: 1, might: 1, power: 1 },
  tagIds: ["Volibear", "Freljord"],
});
const mid = card("mid", "OGN", {
  name: "Mid Spell",
  speeds: ["action", "reaction"],
  keywords: [
    { id: "tank", name: "Tank", scope: "self", value: null },
    { id: "reaction", name: "Reaction", scope: "self", value: null },
    { id: "equip", name: "Equip", scope: "self", value: null },
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
});
