import { copyCount, type CardCopy } from "@/features/analysis/card-copy";
import type { Card } from "@/features/card/card";

const OPENING_HAND_SIZE = 4;
const MULLIGAN_LIMIT = 2;
const TURN_THREE_CARDS_SEEN = 6;
const EARLY_PLAY_ENERGY = 2;

interface CopyOdds {
  readonly copies: number;
  readonly opening: number;
  readonly byTurnThree: number;
}

interface DrawOdds {
  readonly poolSize: number;
  readonly copyOdds: readonly CopyOdds[];
}

type HandVerdict = "keepable" | "risky";

interface HandStats {
  readonly averageEnergy: number | null;
  readonly averagePower: number | null;
  readonly earlyPlays: number;
  readonly verdict: HandVerdict;
}

interface DealtHand {
  readonly hand: readonly Card[];
  readonly pool: readonly Card[];
  readonly cursor: number;
}

interface MulliganedHand {
  readonly hand: readonly Card[];
  readonly cursor: number;
  readonly replaced: number;
}

type MulliganSelection =
  | { readonly type: "selected"; readonly indexes: readonly number[] }
  | { readonly type: "atLimit" };

/** The export has no caller. Kept for a panel that asks the odds of one chosen card. */
function atLeastOneChance(poolSize: number, copies: number, draws: number): number {
  if (poolSize <= 0 || copies <= 0 || draws <= 0) return 0;

  let missChance = 1;

  for (let drawn = 0; drawn < draws; drawn += 1) {
    missChance *= (poolSize - copies - drawn) / (poolSize - drawn);
    if (missChance <= 0) return 1;
  }

  return 1 - missChance;
}

function copiesByIdentity(copies: readonly CardCopy[]): ReadonlyMap<string, number> {
  const byCardId = new Map<string, number>();

  for (const copy of copies) {
    const identity = copy.card.cardId;

    byCardId.set(identity, (byCardId.get(identity) ?? 0) + copy.quantity);
  }

  return byCardId;
}

function drawOdds(copies: readonly CardCopy[]): DrawOdds {
  const poolSize = copyCount(copies);
  const byCardId = copiesByIdentity(copies);
  const counts = [...new Set(byCardId.values())].sort((left, right) => right - left);

  return {
    poolSize,
    copyOdds: counts.map((count) => ({
      copies: count,
      opening: atLeastOneChance(poolSize, count, OPENING_HAND_SIZE),
      byTurnThree: atLeastOneChance(poolSize, count, TURN_THREE_CARDS_SEEN),
    })),
  };
}

function average(values: readonly (number | null)[]): number | null {
  const present = values.filter((value) => value !== null);

  if (present.length === 0) return null;

  return present.reduce((total, value) => total + value, 0) / present.length;
}

function handStats(hand: readonly Card[]): HandStats {
  const earlyPlays = hand.filter(
    (card) => card.attributes.energy !== null && card.attributes.energy <= EARLY_PLAY_ENERGY,
  ).length;

  return {
    averageEnergy: average(hand.map((card) => card.attributes.energy)),
    averagePower: average(hand.map((card) => card.attributes.power)),
    earlyPlays,
    verdict: earlyPlays >= 1 ? "keepable" : "risky",
  };
}

function dealHand(
  copies: readonly CardCopy[],
  shuffle: <T>(items: readonly T[]) => readonly T[],
): DealtHand {
  const library = copies.flatMap((copy) => Array.from({ length: copy.quantity }, () => copy.card));
  const pool = shuffle(library);
  const dealt = Math.min(OPENING_HAND_SIZE, pool.length);

  return { hand: pool.slice(0, dealt), pool, cursor: dealt };
}

function mulliganHand(dealt: DealtHand, indexes: readonly number[]): MulliganedHand {
  const hand = [...dealt.hand];
  const inHandOrder = [...indexes].sort((left, right) => left - right);
  let cursor = dealt.cursor;

  for (const index of inHandOrder) {
    const replacement = dealt.pool.at(cursor);

    if (replacement === undefined) break;

    hand[index] = replacement;
    cursor += 1;
  }

  return { hand, cursor, replaced: cursor - dealt.cursor };
}

function toggleMulliganSelection(indexes: readonly number[], index: number): MulliganSelection {
  if (indexes.includes(index)) {
    return { type: "selected", indexes: indexes.filter((selected) => selected !== index) };
  }

  if (indexes.length >= MULLIGAN_LIMIT) return { type: "atLimit" };

  return { type: "selected", indexes: [...indexes, index] };
}

export {
  MULLIGAN_LIMIT,
  OPENING_HAND_SIZE,
  TURN_THREE_CARDS_SEEN,
  atLeastOneChance,
  dealHand,
  drawOdds,
  handStats,
  mulliganHand,
  toggleMulliganSelection,
};
export type {
  CopyOdds,
  DealtHand,
  DrawOdds,
  HandStats,
  HandVerdict,
  MulliganSelection,
  MulliganedHand,
};
