import type { Card } from "@/features/catalog/card/card";
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
  { title: "Chosen Champion", sections: ["chosenChampion"] },
  { title: "Units", sections: ["mainDeck"], typeIds: ["Unit"] },
  { title: "Spells & Gear", sections: ["mainDeck"], typeIds: ["Spell", "Gear"] },
  { title: "Runes & Battlefields", sections: ["mainDeck"], typeIds: ["Rune", "Battlefield"] },
  { title: "Rune deck", sections: ["runeDeck"] },
  { title: "Battlefields", sections: ["battlefield"] },
  { title: "Sideboard", sections: ["sideboard"] },
];

function deckCards(deck: Deck, cards: readonly Card[]): readonly DeckCard[] {
  const byRiftboundId = new Map(cards.map((card) => [card.riftboundId, card]));

  return deck.entries.flatMap((entry) => {
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

function energyCurve(
  deck: Deck,
  cards: readonly Card[],
): readonly { label: string; count: number }[] {
  const buckets = [
    { label: "0-1", matches: (energy: number) => energy <= 1 },
    { label: "2", matches: (energy: number) => energy === 2 },
    { label: "3", matches: (energy: number) => energy === 3 },
    { label: "4", matches: (energy: number) => energy === 4 },
    { label: "5+", matches: (energy: number) => energy >= 5 },
  ];
  const counted = deckCards(deck, cards).filter(
    (held) => held.card.attributes.energy !== null && held.card.classification.typeId !== "Legend",
  );

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: counted
      .filter((held) => bucket.matches(held.card.attributes.energy ?? 0))
      .reduce((total, held) => total + held.quantity, 0),
  }));
}

function keywordTally(
  deck: Deck,
  cards: readonly Card[],
): readonly { name: string; count: number }[] {
  const tally = new Map<string, number>();

  for (const held of deckCards(deck, cards)) {
    for (const tagId of held.card.tagIds) {
      tally.set(tagId, (tally.get(tagId) ?? 0) + held.quantity);
    }
  }

  return [...tally]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export { deckCards, deckGroups, energyCurve, keywordTally };
export type { DeckCard, DeckGroup };
