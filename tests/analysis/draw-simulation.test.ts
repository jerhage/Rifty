import type { CardCopy } from "@/features/analysis/card-copy";
import {
  atLeastOneChance,
  dealHand,
  drawOdds,
  handStats,
  mulliganHand,
  toggleMulliganSelection,
} from "@/features/analysis/draw-simulation";

import { card, taxonomyId } from "../card/fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: taxonomyId("rare") },
});
const champion = card("champion", "OGN", {
  name: "Volibear - Furious (Alternate Art)",
  attributes: { energy: 2, might: 4, power: null },
});
const championPrint = card("champion-print", "OGN", {
  name: "Volibear - Furious",
  attributes: { energy: 2, might: 4, power: null },
});
const staple = card("staple", "OGN", {
  name: "Staple Unit",
  attributes: { energy: 1, might: 1, power: 2 },
});
const pair = card("pair", "OGN", {
  name: "Paired Spell",
  attributes: { energy: 3, might: null, power: 4 },
  classification: { typeId: "Spell", supertypeId: null, rarityId: taxonomyId("common") },
});
const single = card("single", "OGN", {
  name: "Lone Finisher",
  attributes: { energy: 7, might: 8, power: null },
});
const sideboarded = card("sideboarded", "OGN", { name: "Sideboard Unit" });

const pool: readonly CardCopy[] = [
  { card: champion, quantity: 3 },
  { card: staple, quantity: 3 },
  { card: pair, quantity: 2 },
  { card: single, quantity: 1 },
];

const splitPrintings: readonly CardCopy[] = [
  { card: champion, quantity: 2 },
  { card: championPrint, quantity: 1 },
  { card: staple, quantity: 3 },
  { card: pair, quantity: 3 },
];

const smallPool: readonly CardCopy[] = [
  { card: champion, quantity: 1 },
  { card: staple, quantity: 1 },
  { card: pair, quantity: 1 },
  { card: single, quantity: 1 },
  { card: legend, quantity: 1 },
  { card: sideboarded, quantity: 1 },
];

const shortPool: readonly CardCopy[] = [
  { card: champion, quantity: 1 },
  { card: staple, quantity: 1 },
  { card: pair, quantity: 1 },
  { card: single, quantity: 1 },
  { card: legend, quantity: 1 },
];

function identity<T>(items: readonly T[]): readonly T[] {
  return items;
}

function reversed<T>(items: readonly T[]): readonly T[] {
  return [...items].reverse();
}

describe("at least one chance", () => {
  it("should match the hypergeometric odds of opening a three-of in a forty card deck", () => {
    expect(atLeastOneChance(40, 3, 4)).toBeCloseTo(1 - 66045 / 91390, 12);
  });

  it("should draw a lone copy in an opening hand one time in ten", () => {
    expect(atLeastOneChance(40, 1, 4)).toBeCloseTo(0.1, 12);
  });

  it("should return nothing for a card the deck does not hold or a turn with no draw", () => {
    expect(atLeastOneChance(40, 0, 4)).toBe(0);
    expect(atLeastOneChance(40, 3, 0)).toBe(0);
    expect(atLeastOneChance(0, 3, 4)).toBe(0);
  });

  it("should be certain once the copies leave too few other cards to miss", () => {
    expect(atLeastOneChance(4, 4, 1)).toBe(1);
    expect(atLeastOneChance(6, 5, 2)).toBe(1);
  });
});

describe("draw odds", () => {
  it("should count the copies it is given, most numerous first", () => {
    const odds = drawOdds(pool);

    expect(odds.poolSize).toBe(9);
    expect(odds.copyOdds.map(({ copies }) => copies)).toEqual([3, 2, 1]);
  });

  it("should give each copy count its opening and turn three chances", () => {
    const [threes, twos, ones] = drawOdds(pool).copyOdds;

    expect(threes?.opening).toBeCloseTo(0.880952, 6);
    expect(threes?.byTurnThree).toBeCloseTo(0.988095, 6);
    expect(twos?.opening).toBeCloseTo(0.722222, 6);
    expect(twos?.byTurnThree).toBeCloseTo(0.916667, 6);
    expect(ones?.opening).toBeCloseTo(0.444444, 6);
    expect(ones?.byTurnThree).toBeCloseTo(0.666667, 6);
  });

  it("should sum two printings of one card into a single copy count", () => {
    const odds = drawOdds(splitPrintings);

    expect(odds.poolSize).toBe(9);
    expect(odds.copyOdds.map(({ copies }) => copies)).toEqual([3]);
  });

  it("should keep two cards with different identities in their own copy counts", () => {
    const mixed: readonly CardCopy[] = [
      { card: staple, quantity: 2 },
      { card: pair, quantity: 1 },
    ];

    expect(drawOdds(mixed).copyOdds.map(({ copies }) => copies)).toEqual([2, 1]);
  });

  it("should give an empty pool no buckets rather than odds against nothing", () => {
    expect(drawOdds([])).toEqual({
      poolSize: 0,
      copyOdds: [],
    });
  });
});

describe("hand stats", () => {
  it("should average only the cards carrying a value, count the early plays, and keep the hand", () => {
    expect(handStats([staple, pair, legend])).toEqual({
      averageEnergy: 2,
      averagePower: 3,
      earlyPlays: 1,
      verdict: "keepable",
    });
  });

  it("should have no averages when nothing in hand carries the value", () => {
    expect(handStats([legend])).toEqual({
      averageEnergy: null,
      averagePower: null,
      earlyPlays: 0,
      verdict: "risky",
    });
  });

  it("should call a hand risky when nothing lands on the first two turns", () => {
    expect(handStats([pair, single])).toEqual({
      averageEnergy: 5,
      averagePower: 4,
      earlyPlays: 0,
      verdict: "risky",
    });
  });

  it("should keep a hand as soon as one card costs two or less", () => {
    expect(handStats([champion, single]).verdict).toBe("keepable");
  });
});

describe("dealing a hand", () => {
  it("should expand every copy, so a three-of can arrive more than once", () => {
    expect(dealHand(pool, identity).hand).toEqual([champion, champion, champion, staple]);
  });

  it("should deal from the shuffled order it is given", () => {
    expect(dealHand(pool, reversed).hand).toEqual([single, pair, pair, staple]);
  });

  it("should deal four cards and leave out what it was never given", () => {
    const { hand } = dealHand(pool, identity);

    expect(hand).toHaveLength(4);
    expect(hand).not.toContain(legend);
    expect(hand).not.toContain(sideboarded);
  });

  it("should keep the rest of the shuffled pool behind a cursor past the hand", () => {
    const dealt = dealHand(pool, identity);

    expect(dealt.pool).toHaveLength(9);
    expect(dealt.cursor).toBe(4);
    expect(dealt.pool.slice(0, 4)).toEqual(dealt.hand);
  });

  it("should deal only what a pool shorter than an opening hand holds", () => {
    const dealt = dealHand([{ card: staple, quantity: 2 }], identity);

    expect(dealt.hand).toEqual([staple, staple]);
    expect(dealt.cursor).toBe(2);
  });
});

describe("mulliganing a hand", () => {
  it("should replace one card with the next off the pool", () => {
    const dealt = dealHand(pool, identity);
    const redrawn = mulliganHand(dealt, [1]);

    expect(redrawn.hand).toEqual([champion, staple, champion, staple]);
    expect(redrawn.cursor).toBe(5);
    expect(redrawn.replaced).toBe(1);
  });

  it("should replace two cards with the next two off the pool", () => {
    const dealt = dealHand(smallPool, identity);
    const redrawn = mulliganHand(dealt, [0, 2]);

    expect(redrawn.hand).toEqual([legend, staple, sideboarded, single]);
    expect(redrawn.cursor).toBe(6);
    expect(redrawn.replaced).toBe(2);
  });

  it("should take replacements in hand order however the selection was made", () => {
    const dealt = dealHand(smallPool, identity);

    expect(mulliganHand(dealt, [2, 0])).toEqual(mulliganHand(dealt, [0, 2]));
  });

  it("should leave the hand and the cursor alone when nothing is selected", () => {
    const dealt = dealHand(pool, identity);
    const redrawn = mulliganHand(dealt, []);

    expect(redrawn.hand).toEqual(dealt.hand);
    expect(redrawn.cursor).toBe(dealt.cursor);
    expect(redrawn.replaced).toBe(0);
  });

  it("should never draw the same card twice or move the pool it drew from", () => {
    const dealt = dealHand(smallPool, identity);
    const redrawn = mulliganHand(dealt, [0, 1]);

    expect(redrawn.hand.slice(0, 2)).toEqual(dealt.pool.slice(4, 6));
    expect(dealt.pool).toHaveLength(6);
  });

  it("should replace as many as the pool still holds and report how many it redrew", () => {
    const dealt = dealHand(shortPool, identity);
    const redrawn = mulliganHand(dealt, [1, 3]);

    expect(redrawn.hand).toEqual([champion, legend, pair, single]);
    expect(redrawn.cursor).toBe(5);
    expect(redrawn.replaced).toBe(1);
  });

  it("should redraw nothing when the pool is spent, rather than emptying the hand", () => {
    const dealt = dealHand([{ card: staple, quantity: 3 }], identity);
    const redrawn = mulliganHand(dealt, [0, 1]);

    expect(redrawn.hand).toEqual([staple, staple, staple]);
    expect(redrawn.cursor).toBe(3);
    expect(redrawn.replaced).toBe(0);
  });
});

describe("choosing which cards to mulligan", () => {
  it("should add a card that is not chosen yet", () => {
    expect(toggleMulliganSelection([], 2)).toEqual({ type: "selected", indexes: [2] });
    expect(toggleMulliganSelection([2], 0)).toEqual({ type: "selected", indexes: [2, 0] });
  });

  it("should remove a card that was already chosen", () => {
    expect(toggleMulliganSelection([2, 0], 2)).toEqual({ type: "selected", indexes: [0] });
  });

  it("should refuse a third card", () => {
    expect(toggleMulliganSelection([0, 1], 3)).toEqual({ type: "atLimit" });
  });

  it("should still let a chosen card go once the limit is reached", () => {
    expect(toggleMulliganSelection([0, 1], 1)).toEqual({ type: "selected", indexes: [0] });
  });
});
