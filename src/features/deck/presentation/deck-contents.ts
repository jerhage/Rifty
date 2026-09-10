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
  const byPrintingId = new Map(cards.map((card) => [card.id, card]));

  return deck.entries.flatMap((entry) => {
    if (sections && !sections.includes(entry.section)) return [];

    const card = byPrintingId.get(entry.printingId);

    return card ? [{ card, quantity: entry.quantity }] : [];
  });
}

function chosenChampionCard(deck: Deck, cards: readonly Card[]): Card | null {
  const cardId = deck.chosenChampionCardId;

  if (cardId === null) return null;

  const seated = deck.entries.find(
    (entry) => entry.section === "mainDeck" && entry.cardId === cardId,
  );
  const printed = seated ? cards.find((card) => card.id === seated.printingId) : undefined;

  return printed ?? cards.find((card) => card.cardId === cardId) ?? null;
}

function deckGroups(deck: Deck, cards: readonly Card[]): readonly DeckGroup[] {
  const byPrintingId = new Map(cards.map((card) => [card.id, card]));

  return GROUP_DEFINITIONS.flatMap((definition) => {
    const resolved = deck.entries.flatMap((entry) => {
      if (!definition.sections.includes(entry.section)) return [];

      const card = byPrintingId.get(entry.printingId);
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
