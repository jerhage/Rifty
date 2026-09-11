import type { CardCopy } from "@/features/analysis/card-copy";
import {
  energyCurve,
  keywordMix,
  mightCurve,
  speedMix,
  totalPower,
} from "@/features/analysis/card-metrics";

import {
  card,
  carriedKeyword,
  controllerKeyword,
  grantedKeyword,
  tokenKeyword,
} from "../card/fixtures";

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
  attributes: { energy: 1, might: 1, power: 1 },
  tagIds: ["Volibear", "Freljord"],
});
const mid = card("mid", "OGN", {
  name: "Mid Spell",
  speeds: ["action", "reaction"],
  keywords: [
    carriedKeyword("tank", "Tank"),
    carriedKeyword("reaction", "Reaction"),
    carriedKeyword("equip", "Equip"),
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

const played: readonly CardCopy[] = [
  { card: champion, quantity: 1 },
  { card: cheap, quantity: 3 },
  { card: mid, quantity: 2 },
];
const withSupport: readonly CardCopy[] = [{ card: legend, quantity: 1 }, ...played];

describe("card metrics", () => {
  it("should bucket the copies it is given by energy", () => {
    expect(energyCurve(played)).toEqual([
      { label: "0-1", count: 3 },
      { label: "2", count: 1 },
      { label: "3", count: 2 },
      { label: "4", count: 0 },
      { label: "5+", count: 0 },
    ]);
  });

  it("should bucket those copies by might and total their power", () => {
    expect(mightCurve(played)).toEqual([
      { label: "0-1", count: 3 },
      { label: "2", count: 0 },
      { label: "3", count: 0 },
      { label: "4", count: 1 },
      { label: "5", count: 0 },
      { label: "6+", count: 0 },
    ]);
    expect(totalPower(played)).toBe(3);
  });

  it("should count a supporting copy alongside the rest when it is handed one", () => {
    expect(speedMix(withSupport).find((entry) => entry.speed === "reaction")?.count).toBe(3);
    expect(keywordMix(withSupport).keywords.map((keyword) => keyword.id)).toContain("vision");
  });

  it("should count a card at every speed it can be played, so shares can pass the copy count", () => {
    expect(speedMix(withSupport)).toEqual([
      { speed: "normal", count: 4, share: 4 / 7 },
      { speed: "action", count: 2, share: 2 / 7 },
      { speed: "reaction", count: 3, share: 3 / 7 },
    ]);
  });

  it("should tally keywords by copies held, most common first, and sum their values", () => {
    expect(keywordMix(withSupport)).toEqual({
      carrying: 6,
      keywords: [
        { id: "shield", name: "Shield", count: 3, totalValue: 6 },
        { id: "tank", name: "Tank", count: 2, totalValue: null },
        { id: "vision", name: "Vision", count: 1, totalValue: null },
      ],
    });
  });

  it("should leave out the keywords excluded from this analysis", () => {
    const shown = keywordMix(withSupport).keywords.map((keyword) => keyword.id);

    expect(shown).not.toContain("reaction");
    expect(shown).not.toContain("equip");
    expect(shown).toContain("tank");
  });

  it("should leave out keywords a card only grants to other units", () => {
    const granter = card("granter", "OGN", {
      keywords: [grantedKeyword("shield", "Shield", 2), carriedKeyword("tank", "Tank")],
    });
    const mix = keywordMix([{ card: granter, quantity: 1 }]);

    expect(mix.keywords.map((entry) => entry.id)).toEqual(["tank"]);
    expect(mix.carrying).toBe(1);
  });

  it("should count keywords that act on the controller, such as Add", () => {
    const ramp = card("ramp", "OGN", { keywords: [controllerKeyword("add", "Add")] });
    const mix = keywordMix([{ card: ramp, quantity: 2 }]);

    expect(mix.keywords.map((entry) => entry.id)).toEqual(["add"]);
    expect(mix.carrying).toBe(2);
  });

  it("should leave out a keyword carried by a token the card creates", () => {
    const summoner = card("summoner", "OGN", { keywords: [tokenKeyword("assault", "Assault", 4)] });

    expect(keywordMix([{ card: summoner, quantity: 1 }])).toEqual({ carrying: 0, keywords: [] });
  });

  it("should count no keyword when it is handed no copies", () => {
    expect(keywordMix([])).toEqual({
      carrying: 0,
      keywords: [],
    });
  });
});
