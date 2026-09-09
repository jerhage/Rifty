import type { CardCopy } from "@/features/analysis/card-copy";
import type { Card } from "@/features/catalog/card/card";
import { cardIdentityName } from "@/features/catalog/card/card-identity";

const OPENING_HAND_SIZE = 4;
const TURN_THREE_CARDS_SEEN = 6;
const EARLY_PLAY_ENERGY = 2;

interface CopyOdds {
  readonly copies: number;
  readonly opening: number;
  readonly byTurnThree: number;
}

interface PinnedOdds {
  readonly name: string;
  readonly copies: number;
  readonly opening: number;
  readonly byTurnThree: number;
}

interface DrawOdds {
  readonly poolSize: number;
  readonly copyOdds: readonly CopyOdds[];
  readonly pinned: PinnedOdds | null;
}

type HandVerdict = "keepable" | "risky";

interface HandStats {
  readonly averageEnergy: number | null;
  readonly averagePower: number | null;
  readonly earlyPlays: number;
  readonly verdict: HandVerdict;
}

function atLeastOneChance(poolSize: number, copies: number, draws: number): number {
  if (poolSize <= 0 || copies <= 0 || draws <= 0) return 0;

  let missChance = 1;

  for (let drawn = 0; drawn < draws; drawn += 1) {
    missChance *= (poolSize - copies - drawn) / (poolSize - drawn);
    if (missChance <= 0) return 1;
  }

  return 1 - missChance;
}

function copyCount(copies: readonly CardCopy[]): number {
  return copies.reduce((total, entry) => total + entry.quantity, 0);
}

function pinnedOdds(
  copies: readonly CardCopy[],
  pinned: Card | null,
  poolSize: number,
): PinnedOdds | null {
  if (pinned === null) return null;

  const entry = copies.find((candidate) => candidate.card.riftboundId === pinned.riftboundId);
  if (!entry) return null;

  return {
    name: cardIdentityName(entry.card),
    copies: entry.quantity,
    opening: atLeastOneChance(poolSize, entry.quantity, OPENING_HAND_SIZE),
    byTurnThree: atLeastOneChance(poolSize, entry.quantity, TURN_THREE_CARDS_SEEN),
  };
}

function drawOdds(copies: readonly CardCopy[], pinned: Card | null): DrawOdds {
  const poolSize = copyCount(copies);
  const counts = [...new Set(copies.map((entry) => entry.quantity))].sort(
    (left, right) => right - left,
  );

  return {
    poolSize,
    copyOdds: counts.map((held) => ({
      copies: held,
      opening: atLeastOneChance(poolSize, held, OPENING_HAND_SIZE),
      byTurnThree: atLeastOneChance(poolSize, held, TURN_THREE_CARDS_SEEN),
    })),
    pinned: pinnedOdds(copies, pinned, poolSize),
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

function openingHand(
  copies: readonly CardCopy[],
  shuffle: <T>(items: readonly T[]) => readonly T[],
): readonly Card[] {
  const library = copies.flatMap((entry) =>
    Array.from({ length: entry.quantity }, () => entry.card),
  );

  return shuffle(library).slice(0, OPENING_HAND_SIZE);
}

export {
  OPENING_HAND_SIZE,
  TURN_THREE_CARDS_SEEN,
  atLeastOneChance,
  drawOdds,
  handStats,
  openingHand,
};
export type { CopyOdds, DrawOdds, HandStats, HandVerdict, PinnedOdds };
