import { match } from "ts-pattern";

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

type GroupContents =
  | { readonly type: "everyCard" }
  | { readonly type: "ofTypes"; readonly typeIds: readonly CardType[] };

interface GroupDefinition {
  readonly title: string;
  readonly sections: readonly DeckSection[];
  readonly contents: GroupContents;
}

const EVERY_CARD: GroupContents = { type: "everyCard" };

const GROUP_DEFINITIONS: readonly GroupDefinition[] = [
  { title: "Legend", sections: ["legend"], contents: EVERY_CARD },
  { title: "Units", sections: ["mainDeck"], contents: { type: "ofTypes", typeIds: ["Unit"] } },
  {
    title: "Spells & Gear",
    sections: ["mainDeck"],
    contents: { type: "ofTypes", typeIds: ["Spell", "Gear"] },
  },
  {
    title: "Runes & Battlefields",
    sections: ["mainDeck"],
    contents: { type: "ofTypes", typeIds: ["Rune", "Battlefield"] },
  },
  { title: "Rune deck", sections: ["runeDeck"], contents: EVERY_CARD },
  { title: "Battlefields", sections: ["battlefield"], contents: EVERY_CARD },
  { title: "Sideboard", sections: ["sideboard"], contents: EVERY_CARD },
];

const MAIN_DECK_SECTIONS: readonly DeckSection[] = ["mainDeck"];
const MAIN_DECK_WITH_LEGEND: readonly DeckSection[] = ["legend", "mainDeck"];

function deckCards(
  entries: readonly ResolvedDeckEntry[],
  sections: readonly DeckSection[],
): readonly CardCopy[] {
  return entries
    .filter((entry) => sections.includes(entry.section))
    .map(({ card, quantity }) => ({ card, quantity }));
}

function holdsCard(contents: GroupContents): (copy: CardCopy) => boolean {
  return match(contents)
    .with({ type: "everyCard" }, () => () => true)
    .with(
      { type: "ofTypes" },
      ({ typeIds }) =>
        (copy: CardCopy) =>
          typeIds.includes(copy.card.classification.typeId),
    )
    .exhaustive();
}

function deckGroups(entries: readonly ResolvedDeckEntry[]): readonly DeckGroup[] {
  return GROUP_DEFINITIONS.flatMap((definition) => {
    const resolved = deckCards(entries, definition.sections).filter(holdsCard(definition.contents));

    if (resolved.length === 0) return [];

    return [
      {
        title: definition.title,
        sections: definition.sections,
        cards: [...resolved].sort((left, right) => left.card.name.localeCompare(right.card.name)),
        count: resolved.reduce((total, copy) => total + copy.quantity, 0),
      },
    ];
  });
}

export { MAIN_DECK_SECTIONS, MAIN_DECK_WITH_LEGEND, deckCards, deckGroups };
export type { DeckGroup };
