import type { CardCopy } from "@/features/analysis/card-copy";
import {
  atLeastOneChance,
  dealHand,
  drawOdds,
  handStats,
  mulliganHand,
  toggleMulliganSelection,
} from "@/features/analysis/draw-simulation";

import { card } from "../card/fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
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

const splitPrintings: readonly CardCopy[] = [
  { card: champion, quantity: 2 },
  { card: championPrint, quantity: 1 },
  { card: staple, quantity: 3 },
  { card: pair, quantity: 3 },
];

const smallLibrary: readonly CardCopy[] = [
  { card: champion, quantity: 1 },
  { card: staple, quantity: 1 },
  { card: pair, quantity: 1 },
  { card: single, quantity: 1 },
  { card: legend, quantity: 1 },
  { card: sideboarded, quantity: 1 },
];

const shortLibrary: readonly CardCopy[] = [
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

  it("sums two printings of one card into a single copy count", () => {
    const odds = drawOdds(splitPrintings, null);

    expect(odds.poolSize).toBe(9);
    expect(odds.copyOdds.map((entry) => entry.copies)).toEqual([3]);
  });

  it("keeps two cards with different identities in their own copy counts", () => {
    const mixed: readonly CardCopy[] = [
      { card: staple, quantity: 2 },
      { card: pair, quantity: 1 },
    ];

    expect(drawOdds(mixed, null).copyOdds.map((entry) => entry.copies)).toEqual([2, 1]);
  });

  it("counts every printing of the pinned card as copies of one card", () => {
    const odds = drawOdds(splitPrintings, champion).pinned;

    expect(odds?.name).toBe("Volibear - Furious");
    expect(odds?.copies).toBe(3);
    expect(odds?.opening).toBeCloseTo(0.880952, 6);
    expect(odds?.byTurnThree).toBeCloseTo(0.988095, 6);
    expect(drawOdds(splitPrintings, championPrint).pinned?.copies).toBe(3);
  });

  it("has no pinned row when the pool holds no printing of the pinned card", () => {
    const without: readonly CardCopy[] = [
      { card: staple, quantity: 3 },
      { card: pair, quantity: 3 },
    ];

    expect(drawOdds(without, champion).pinned).toBeNull();
    expect(drawOdds(without, championPrint).pinned).toBeNull();
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

describe("dealing a hand", () => {
  it("expands every copy, so a three-of can arrive more than once", () => {
    expect(dealHand(library, identity).hand).toEqual([champion, champion, champion, staple]);
  });

  it("deals from the shuffled order it is given", () => {
    expect(dealHand(library, reversed).hand).toEqual([single, pair, pair, staple]);
  });

  it("deals four cards and leaves out what it was never given", () => {
    const { hand } = dealHand(library, identity);

    expect(hand).toHaveLength(4);
    expect(hand).not.toContain(legend);
    expect(hand).not.toContain(sideboarded);
  });

  it("keeps the rest of the shuffled pool behind a cursor past the hand", () => {
    const dealt = dealHand(library, identity);

    expect(dealt.pool).toHaveLength(9);
    expect(dealt.cursor).toBe(4);
    expect(dealt.pool.slice(0, 4)).toEqual(dealt.hand);
  });

  it("deals only what a pool shorter than an opening hand holds", () => {
    const dealt = dealHand([{ card: staple, quantity: 2 }], identity);

    expect(dealt.hand).toEqual([staple, staple]);
    expect(dealt.cursor).toBe(2);
  });
});

describe("mulliganing a hand", () => {
  it("replaces one card with the next off the pool", () => {
    const dealt = dealHand(library, identity);
    const redrawn = mulliganHand(dealt, [1]);

    expect(redrawn.hand).toEqual([champion, staple, champion, staple]);
    expect(redrawn.cursor).toBe(5);
    expect(redrawn.replaced).toBe(1);
  });

  it("replaces two cards with the next two off the pool", () => {
    const dealt = dealHand(smallLibrary, identity);
    const redrawn = mulliganHand(dealt, [0, 2]);

    expect(redrawn.hand).toEqual([legend, staple, sideboarded, single]);
    expect(redrawn.cursor).toBe(6);
    expect(redrawn.replaced).toBe(2);
  });

  it("takes replacements in hand order however the selection was made", () => {
    const dealt = dealHand(smallLibrary, identity);

    expect(mulliganHand(dealt, [2, 0])).toEqual(mulliganHand(dealt, [0, 2]));
  });

  it("leaves the hand and the cursor alone when nothing is selected", () => {
    const dealt = dealHand(library, identity);
    const redrawn = mulliganHand(dealt, []);

    expect(redrawn.hand).toEqual(dealt.hand);
    expect(redrawn.cursor).toBe(dealt.cursor);
    expect(redrawn.replaced).toBe(0);
  });

  it("never draws the same card twice or moves the pool it drew from", () => {
    const dealt = dealHand(smallLibrary, identity);
    const redrawn = mulliganHand(dealt, [0, 1]);

    expect(redrawn.hand.slice(0, 2)).toEqual(dealt.pool.slice(4, 6));
    expect(dealt.pool).toHaveLength(6);
  });

  it("replaces as many as the pool still holds and reports how many it redrew", () => {
    const dealt = dealHand(shortLibrary, identity);
    const redrawn = mulliganHand(dealt, [1, 3]);

    expect(redrawn.hand).toEqual([champion, legend, pair, single]);
    expect(redrawn.cursor).toBe(5);
    expect(redrawn.replaced).toBe(1);
  });

  it("redraws nothing when the pool is spent, rather than emptying the hand", () => {
    const dealt = dealHand([{ card: staple, quantity: 3 }], identity);
    const redrawn = mulliganHand(dealt, [0, 1]);

    expect(redrawn.hand).toEqual([staple, staple, staple]);
    expect(redrawn.cursor).toBe(3);
    expect(redrawn.replaced).toBe(0);
  });
});

describe("choosing which cards to mulligan", () => {
  it("adds a card that is not chosen yet", () => {
    expect(toggleMulliganSelection([], 2)).toEqual({ type: "selected", indexes: [2] });
    expect(toggleMulliganSelection([2], 0)).toEqual({ type: "selected", indexes: [2, 0] });
  });

  it("removes a card that was already chosen", () => {
    expect(toggleMulliganSelection([2, 0], 2)).toEqual({ type: "selected", indexes: [0] });
  });

  it("refuses a third card", () => {
    expect(toggleMulliganSelection([0, 1], 3)).toEqual({ type: "atLimit" });
  });

  it("still lets a chosen card go once the limit is reached", () => {
    expect(toggleMulliganSelection([0, 1], 1)).toEqual({ type: "selected", indexes: [0] });
  });
});
