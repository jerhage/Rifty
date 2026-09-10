import type { CardCopy } from "@/features/analysis/card-copy";
import type { Card } from "@/features/card/card";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { Deck, DeckSection } from "@/features/deck/deck/deck";

interface DeckGroup {
  readonly title: string;
  readonly sections: readonly DeckSection[];
  readonly cards: readonly CardCopy[];
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

const MAIN_DECK_SECTIONS: readonly DeckSection[] = ["mainDeck"];
const MAIN_DECK_WITH_LEGEND: readonly DeckSection[] = ["legend", "mainDeck"];

function deckCards(
  deck: Deck,
  cards: readonly Card[],
  sections?: readonly DeckSection[],
): readonly CardCopy[] {
  const byRiftboundId = new Map(cards.map((card) => [card.riftboundId, card]));

  return deck.entries.flatMap((entry) => {
    if (sections && !sections.includes(entry.section)) return [];

    const card = byRiftboundId.get(entry.cardRiftboundId);

    return card ? [{ card, quantity: entry.quantity }] : [];
  });
}

function chosenChampionCard(deck: Deck, cards: readonly Card[]): Card | null {
  const riftboundId = deck.chosenChampionRiftboundId;

  if (riftboundId === null) return null;

  return cards.find((card) => card.riftboundId === riftboundId) ?? null;
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

export { MAIN_DECK_SECTIONS, MAIN_DECK_WITH_LEGEND, chosenChampionCard, deckCards, deckGroups };
export type { DeckGroup };
