import type { Card, CardKeyword } from "@/features/catalog/card/card";
import type { CardSpeed } from "@/features/catalog/value-objects/card-speed";
import type { CardType } from "@/features/catalog/value-objects/card-type";
import type { Deck, DeckSection } from "@/features/deck/deck/deck";

interface DeckCard {
  readonly card: Card;
  readonly quantity: number;
}

interface DeckGroup {
  readonly title: string;
  readonly sections: readonly DeckSection[];
  readonly cards: readonly DeckCard[];
  readonly count: number;
}

interface GroupDefinition {
  readonly title: string;
  readonly sections: readonly DeckSection[];
  readonly typeIds?: readonly CardType[];
}

const GROUP_DEFINITIONS: readonly GroupDefinition[] = [
  { title: "Legend", sections: ["legend"] },
  { title: "Units", sections: ["mainDeck"], typeIds: ["Unit"] },
  { title: "Spells & Gear", sections: ["mainDeck"], typeIds: ["Spell", "Gear"] },
  { title: "Runes & Battlefields", sections: ["mainDeck"], typeIds: ["Rune", "Battlefield"] },
  { title: "Rune deck", sections: ["runeDeck"] },
  { title: "Battlefields", sections: ["battlefield"] },
  { title: "Sideboard", sections: ["sideboard"] },
];

const CURVE_SECTIONS: readonly DeckSection[] = ["mainDeck"];
const MAIN_DECK_WITH_LEGEND: readonly DeckSection[] = ["legend", "mainDeck"];
const SPEED_ORDER: readonly CardSpeed[] = ["normal", "action", "reaction"];
const EXCLUDED_KEYWORD_IDS: readonly string[] = ["action", "reaction", "equip"];

function deckCards(
  deck: Deck,
  cards: readonly Card[],
  sections?: readonly DeckSection[],
): readonly DeckCard[] {
  const byRiftboundId = new Map(cards.map((card) => [card.riftboundId, card]));

  return deck.entries.flatMap((entry) => {
    if (sections && !sections.includes(entry.section)) return [];

    const card = byRiftboundId.get(entry.cardRiftboundId);

    return card ? [{ card, quantity: entry.quantity }] : [];
  });
}

function deckGroups(deck: Deck, cards: readonly Card[]): readonly DeckGroup[] {
  const byRiftboundId = new Map(cards.map((card) => [card.riftboundId, card]));

  return GROUP_DEFINITIONS.flatMap((definition) => {
    const resolved = deck.entries.flatMap((entry) => {
      if (!definition.sections.includes(entry.section)) return [];

      const card = byRiftboundId.get(entry.cardRiftboundId);
      if (!card) return [];
      if (definition.typeIds && !definition.typeIds.includes(card.classification.typeId)) return [];

      return [{ card, quantity: entry.quantity }];
    });

    if (resolved.length === 0) return [];

    return [
      {
        title: definition.title,
        sections: definition.sections,
        cards: [...resolved].sort((left, right) => left.card.name.localeCompare(right.card.name)),
        count: resolved.reduce((total, held) => total + held.quantity, 0),
      },
    ];
  });
}

interface CurveBucket {
  readonly label: string;
  readonly count: number;
}

function curve(
  held: readonly DeckCard[],
  value: (card: Card) => number | null,
  buckets: readonly { readonly label: string; readonly matches: (value: number) => boolean }[],
): readonly CurveBucket[] {
  const counted = held.filter((entry) => value(entry.card) !== null);

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: counted
      .filter((entry) => bucket.matches(value(entry.card) ?? 0))
      .reduce((total, entry) => total + entry.quantity, 0),
  }));
}

function energyCurve(deck: Deck, cards: readonly Card[]): readonly CurveBucket[] {
  return curve(deckCards(deck, cards, CURVE_SECTIONS), (card) => card.attributes.energy, [
    { label: "0-1", matches: (energy) => energy <= 1 },
    { label: "2", matches: (energy) => energy === 2 },
    { label: "3", matches: (energy) => energy === 3 },
    { label: "4", matches: (energy) => energy === 4 },
    { label: "5+", matches: (energy) => energy >= 5 },
  ]);
}

function mightCurve(deck: Deck, cards: readonly Card[]): readonly CurveBucket[] {
  return curve(deckCards(deck, cards, CURVE_SECTIONS), (card) => card.attributes.might, [
    { label: "0-1", matches: (might) => might <= 1 },
    { label: "2", matches: (might) => might === 2 },
    { label: "3", matches: (might) => might === 3 },
    { label: "4", matches: (might) => might === 4 },
    { label: "5", matches: (might) => might === 5 },
    { label: "6+", matches: (might) => might >= 6 },
  ]);
}

function abilityCardCount(deck: Deck, cards: readonly Card[]): number {
  return deckCards(deck, cards, MAIN_DECK_WITH_LEGEND).reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
}

function totalPower(deck: Deck, cards: readonly Card[]): number {
  return deckCards(deck, cards, CURVE_SECTIONS).reduce(
    (total, entry) => total + (entry.card.attributes.power ?? 0) * entry.quantity,
    0,
  );
}

interface SpeedShare {
  readonly speed: CardSpeed;
  readonly count: number;
  readonly share: number;
}

/**
 * A card played at more than one speed counts in each, so the shares can add past the deck size.
 */
function speedMix(deck: Deck, cards: readonly Card[]): readonly SpeedShare[] {
  const held = deckCards(deck, cards, MAIN_DECK_WITH_LEGEND);
  const total = held.reduce((sum, entry) => sum + entry.quantity, 0);

  return SPEED_ORDER.map((speed) => {
    const count = held
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

function countedKeywords(card: Card): readonly CardKeyword[] {
  return card.keywords.filter((keyword) => !EXCLUDED_KEYWORD_IDS.includes(keyword.id));
}

function keywordMix(deck: Deck, cards: readonly Card[]): KeywordMix {
  const held = deckCards(deck, cards, MAIN_DECK_WITH_LEGEND);
  const tally = new Map<string, KeywordShare>();

  for (const entry of held) {
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
    carrying: held
      .filter((entry) => countedKeywords(entry.card).length > 0)
      .reduce((total, entry) => total + entry.quantity, 0),
    keywords: [...tally.values()].sort(
      (left, right) => right.count - left.count || left.name.localeCompare(right.name),
    ),
  };
}

export {
  abilityCardCount,
  deckCards,
  deckGroups,
  energyCurve,
  keywordMix,
  mightCurve,
  speedMix,
  totalPower,
};
export type { CurveBucket, DeckCard, DeckGroup, KeywordMix, KeywordShare, SpeedShare };
