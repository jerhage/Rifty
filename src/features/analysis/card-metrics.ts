import { match, P } from "ts-pattern";

import { copyCount, type CardCopy } from "@/features/analysis/card-copy";
import type { Card, CardKeyword, CardKeywordTarget } from "@/features/card/card";
import type { CardSpeed } from "@/features/card/value-objects/card-speed";

const SPEED_ORDER: readonly CardSpeed[] = ["normal", "action", "reaction"];
const EXCLUDED_KEYWORD_IDS: readonly string[] = ["action", "reaction", "equip"];

interface CurveBucket {
  readonly label: string;
  readonly count: number;
}

function curve(
  copies: readonly CardCopy[],
  value: (card: Card) => number | null,
  buckets: readonly { readonly label: string; readonly matches: (value: number) => boolean }[],
): readonly CurveBucket[] {
  const counted = copies.filter((entry) => value(entry.card) !== null);

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: counted
      .filter((entry) => bucket.matches(value(entry.card) ?? 0))
      .reduce((total, entry) => total + entry.quantity, 0),
  }));
}

function energyCurve(copies: readonly CardCopy[]): readonly CurveBucket[] {
  return curve(copies, (card) => card.attributes.energy, [
    { label: "0-1", matches: (energy) => energy <= 1 },
    { label: "2", matches: (energy) => energy === 2 },
    { label: "3", matches: (energy) => energy === 3 },
    { label: "4", matches: (energy) => energy === 4 },
    { label: "5+", matches: (energy) => energy >= 5 },
  ]);
}

function mightCurve(copies: readonly CardCopy[]): readonly CurveBucket[] {
  return curve(copies, (card) => card.attributes.might, [
    { label: "0-1", matches: (might) => might <= 1 },
    { label: "2", matches: (might) => might === 2 },
    { label: "3", matches: (might) => might === 3 },
    { label: "4", matches: (might) => might === 4 },
    { label: "5", matches: (might) => might === 5 },
    { label: "6+", matches: (might) => might >= 6 },
  ]);
}

function totalPower(copies: readonly CardCopy[]): number {
  return copies.reduce(
    (total, entry) => total + (entry.card.attributes.power ?? 0) * entry.quantity,
    0,
  );
}

interface SpeedShare {
  readonly speed: CardSpeed;
  readonly count: number;
  readonly share: number;
}

function speedMix(copies: readonly CardCopy[]): readonly SpeedShare[] {
  const total = copyCount(copies);

  return SPEED_ORDER.map((speed) => {
    const count = copies
      .filter((entry) => entry.card.speeds.includes(speed))
      .reduce((sum, entry) => sum + entry.quantity, 0);

    return { speed, count, share: total === 0 ? 0 : count / total };
  });
}

interface KeywordShare {
  readonly id: string;
  readonly name: string;
  readonly count: number;
  readonly totalValue: number | null;
}

interface KeywordMix {
  readonly carrying: number;
  readonly keywords: readonly KeywordShare[];
}

function benefitsOwnSide(target: CardKeywordTarget): boolean {
  return match(target)
    .with({ kind: "self" }, () => true)
    .with(
      {
        kind: P.union("unit", "gear", "spell", "card", "player", "effect", "cost", "rule"),
      },
      ({ allegiance, isToken }) =>
        match(allegiance)
          .with("own", () => !isToken)
          .with("friendly", "enemy", "any_player", "unspecified", () => false)
          .exhaustive(),
    )
    .exhaustive();
}

function countedKeywords(card: Card): readonly CardKeyword[] {
  return card.keywords.filter(
    (keyword) =>
      keyword.targets.some(benefitsOwnSide) && !EXCLUDED_KEYWORD_IDS.includes(keyword.id),
  );
}

function keywordMix(copies: readonly CardCopy[]): KeywordMix {
  const tally = new Map<string, KeywordShare>();

  for (const entry of copies) {
    for (const keyword of countedKeywords(entry.card)) {
      const running = tally.get(keyword.id);
      const value =
        keyword.value === null
          ? (running?.totalValue ?? null)
          : (running?.totalValue ?? 0) + keyword.value * entry.quantity;

      tally.set(keyword.id, {
        id: keyword.id,
        name: keyword.name,
        count: (running?.count ?? 0) + entry.quantity,
        totalValue: value,
      });
    }
  }

  return {
    carrying: copies
      .filter((entry) => countedKeywords(entry.card).length > 0)
      .reduce((total, entry) => total + entry.quantity, 0),
    keywords: [...tally.values()].sort(
      (left, right) => right.count - left.count || left.name.localeCompare(right.name),
    ),
  };
}

export { energyCurve, keywordMix, mightCurve, speedMix, totalPower };
export type { CurveBucket, KeywordMix, KeywordShare, SpeedShare };
