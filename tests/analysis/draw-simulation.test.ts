import type { CardCopy } from "@/features/analysis/card-copy";
import {
  atLeastOneChance,
  drawOdds,
  handStats,
  openingHand,
} from "@/features/analysis/draw-simulation";

import { card } from "../catalog/fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const champion = card("champion", "OGN", {
  name: "Volibear - Furious (Alternate Art)",
  attributes: { energy: 2, might: 4, power: null },
});
const staple = card("staple", "OGN", {
  name: "Staple Unit",
  attributes: { energy: 1, might: 1, power: 2 },
});
const pair = card("pair", "OGN", {
  name: "Paired Spell",
  attributes: { energy: 3, might: null, power: 4 },
  classification: { typeId: "Spell", supertypeId: null, rarityId: "common" },
});
const single = card("single", "OGN", {
  name: "Lone Finisher",
  attributes: { energy: 7, might: 8, power: null },
});
const sideboarded = card("sideboarded", "OGN", { name: "Sideboard Unit" });

const library: readonly CardCopy[] = [
  { card: champion, quantity: 3 },
  { card: staple, quantity: 3 },
  { card: pair, quantity: 2 },
  { card: single, quantity: 1 },
];

function identity<T>(items: readonly T[]): readonly T[] {
  return items;
}

function reversed<T>(items: readonly T[]): readonly T[] {
  return [...items].reverse();
}

describe("at least one chance", () => {
  it("matches the hypergeometric odds of opening a three-of in a forty card deck", () => {
    expect(atLeastOneChance(40, 3, 4)).toBeCloseTo(1 - 66045 / 91390, 12);
  });

  it("draws a lone copy in an opening hand one time in ten", () => {
    expect(atLeastOneChance(40, 1, 4)).toBeCloseTo(0.1, 12);
  });

  it("returns nothing for a card the deck does not hold or a turn with no draw", () => {
    expect(atLeastOneChance(40, 0, 4)).toBe(0);
    expect(atLeastOneChance(40, 3, 0)).toBe(0);
    expect(atLeastOneChance(0, 3, 4)).toBe(0);
  });

  it("is certain once the copies leave too few other cards to miss", () => {
    expect(atLeastOneChance(4, 4, 1)).toBe(1);
    expect(atLeastOneChance(6, 5, 2)).toBe(1);
  });
});

describe("draw odds", () => {
  it("counts the copies it is given, most numerous first", () => {
    const odds = drawOdds(library, null);

    expect(odds.poolSize).toBe(9);
    expect(odds.copyOdds.map((entry) => entry.copies)).toEqual([3, 2, 1]);
  });

  it("gives each copy count its opening and turn three chances", () => {
    const [threes, twos, ones] = drawOdds(library, null).copyOdds;

    expect(threes?.opening).toBeCloseTo(0.880952, 6);
    expect(threes?.byTurnThree).toBeCloseTo(0.988095, 6);
    expect(twos?.opening).toBeCloseTo(0.722222, 6);
    expect(twos?.byTurnThree).toBeCloseTo(0.916667, 6);
    expect(ones?.opening).toBeCloseTo(0.444444, 6);
    expect(ones?.byTurnThree).toBeCloseTo(0.666667, 6);
  });

  it("reports the pinned card held among the copies", () => {
    const odds = drawOdds(library, champion).pinned;

    expect(odds?.name).toBe("Volibear - Furious");
    expect(odds?.copies).toBe(3);
    expect(odds?.opening).toBeCloseTo(0.880952, 6);
    expect(odds?.byTurnThree).toBeCloseTo(0.988095, 6);
  });

  it("has no pinned row when none is pinned or the copies do not hold it", () => {
    const without: readonly CardCopy[] = [{ card: staple, quantity: 3 }];

    expect(drawOdds(library, null).pinned).toBeNull();
    expect(drawOdds(without, champion).pinned).toBeNull();
  });

  it("gives an empty library no buckets rather than odds against nothing", () => {
    expect(drawOdds([], null)).toEqual({
      poolSize: 0,
      copyOdds: [],
      pinned: null,
    });
  });
});

describe("hand stats", () => {
  it("averages only the cards carrying a value and counts the early plays", () => {
    expect(handStats([staple, pair, legend])).toEqual({
      averageEnergy: 2,
      averagePower: 3,
      earlyPlays: 1,
      verdict: "keepable",
    });
  });

  it("has no averages when nothing in hand carries the value", () => {
    expect(handStats([legend])).toEqual({
      averageEnergy: null,
      averagePower: null,
      earlyPlays: 0,
      verdict: "risky",
    });
  });

  it("calls a hand risky when nothing lands on the first two turns", () => {
    expect(handStats([pair, single])).toEqual({
      averageEnergy: 5,
      averagePower: 4,
      earlyPlays: 0,
      verdict: "risky",
    });
  });

  it("keeps a hand as soon as one card costs two or less", () => {
    expect(handStats([champion, single]).verdict).toBe("keepable");
  });
});

describe("opening hand", () => {
  it("expands every copy, so a three-of can arrive more than once", () => {
    expect(openingHand(library, identity)).toEqual([champion, champion, champion, staple]);
  });

  it("deals from the shuffled order it is given", () => {
    expect(openingHand(library, reversed)).toEqual([single, pair, pair, staple]);
  });

  it("deals four cards and leaves out what it was never given", () => {
    const hand = openingHand(library, identity);

    expect(hand).toHaveLength(4);
    expect(hand).not.toContain(legend);
    expect(hand).not.toContain(sideboarded);
  });
});
