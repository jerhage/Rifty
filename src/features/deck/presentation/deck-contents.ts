import type { CardCopy } from "@/features/analysis/card-copy";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import type { ResolvedDeckEntry } from "@/features/deck/deck/resolved-deck";

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
  entries: readonly ResolvedDeckEntry[],
  sections: readonly DeckSection[],
): readonly CardCopy[] {
  return entries.filter((entry) => sections.includes(entry.section));
}

function deckGroups(entries: readonly ResolvedDeckEntry[]): readonly DeckGroup[] {
  return GROUP_DEFINITIONS.flatMap((definition) => {
    const resolved = deckCards(entries, definition.sections).filter(
      (held) => !definition.typeIds || definition.typeIds.includes(held.card.classification.typeId),
    );

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

export { MAIN_DECK_SECTIONS, MAIN_DECK_WITH_LEGEND, deckCards, deckGroups };
export type { DeckGroup };
