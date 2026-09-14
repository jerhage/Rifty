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
  const counted = copies.filter((copy) => value(copy.card) !== null);

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: counted
      .filter((copy) => bucket.matches(value(copy.card) ?? 0))
      .reduce((total, copy) => total + copy.quantity, 0),
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

/** Not in use. Waiting on a might-curve panel beside the energy curve in `DeckAnalysisPanels`. */
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

/** Not in use. Waiting on a total-power line in `DeckAnalysisPanels`. */
function totalPower(copies: readonly CardCopy[]): number {
  return copies.reduce(
    (total, copy) => total + (copy.card.attributes.power ?? 0) * copy.quantity,
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
      .filter((copy) => copy.card.speeds.includes(speed))
      .reduce((sum, copy) => sum + copy.quantity, 0);

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
  const shares = new Map<string, KeywordShare>();

  for (const copy of copies) {
    for (const keyword of countedKeywords(copy.card)) {
      const running = shares.get(keyword.id);
      const value =
        keyword.value === null
          ? (running?.totalValue ?? null)
          : (running?.totalValue ?? 0) + keyword.value * copy.quantity;

      shares.set(keyword.id, {
        id: keyword.id,
        name: keyword.name,
        count: (running?.count ?? 0) + copy.quantity,
        totalValue: value,
      });
    }
  }

  return {
    carrying: copies
      .filter((copy) => countedKeywords(copy.card).length > 0)
      .reduce((total, copy) => total + copy.quantity, 0),
    keywords: [...shares.values()].sort(
      (left, right) => right.count - left.count || left.name.localeCompare(right.name),
    ),
  };
}

export { energyCurve, keywordMix, mightCurve, speedMix, totalPower };
export type { CurveBucket, KeywordMix, KeywordShare, SpeedShare };
