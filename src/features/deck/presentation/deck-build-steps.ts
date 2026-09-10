import type { Card } from "@/features/card/card";
import type { CardId } from "@/features/card/value-objects/card-id";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import {
  DECK_SECTIONS,
  type Deck,
  type DeckEntry,
  type DeckSection,
} from "@/features/deck/deck/deck";

type DeckBuildStepId = "legend" | "chosenChampion" | "zones";

interface DeckBuildStep {
  readonly id: DeckBuildStepId;
  readonly label: string;
  readonly title: string;
  readonly blurb: string;
}

const DECK_BUILD_STEPS: readonly DeckBuildStep[] = [
  {
    id: "legend",
    label: "Legend",
    title: "Pick your Legend",
    blurb:
      "Starts the game in play and sets which domains your 40 can pull from. It sits outside every count.",
  },
  {
    id: "chosenChampion",
    label: "Chosen Champion",
    title: "Name your Champion",
    blurb:
      "One champion unit is your Chosen Champion. It starts in the champion zone and shares its three copies with the main deck.",
  },
  {
    id: "zones",
    label: "Zones",
    title: "Build zones",
    blurb: "Fill each zone, then check the deck before you save it.",
  },
];

interface DraftZoneCard {
  readonly card: Card;
  readonly quantity: number;
}

interface DeckBuildDraft {
  readonly name: string;
  readonly legend: Card | null;
  readonly chosenChampion: Card | null;
  readonly zoneCards: Readonly<Record<DeckSection, Readonly<Record<PrintingId, DraftZoneCard>>>>;
}

const EMPTY_DRAFT: DeckBuildDraft = {
  name: "",
  legend: null,
  chosenChampion: null,
  zoneCards: {
    legend: {},
    mainDeck: {},
    runeDeck: {},
    battlefield: {},
    sideboard: {},
  },
};

function withZoneCard(
  draft: DeckBuildDraft,
  section: DeckSection,
  printingId: PrintingId,
  placed: DraftZoneCard,
): DeckBuildDraft {
  const zoneCards: Record<DeckSection, Readonly<Record<PrintingId, DraftZoneCard>>> = {
    ...draft.zoneCards,
  };
  zoneCards[section] = { ...zoneCards[section], [printingId]: placed };

  return { ...draft, zoneCards };
}

function quantityOf(draft: DeckBuildDraft, section: DeckSection, printingId: PrintingId): number {
  return draft.zoneCards[section][printingId]?.quantity ?? 0;
}

function draftEntries(draft: DeckBuildDraft): DeckEntry[] {
  const entries: DeckEntry[] = [];

  if (draft.legend) {
    entries.push({
      section: "legend",
      cardId: draft.legend.cardId,
      printingId: draft.legend.printingId,
      quantity: 1,
    });
  }
  for (const section of DECK_SECTIONS) {
    for (const placed of Object.values(draft.zoneCards[section])) {
      if (placed.quantity <= 0) continue;

      entries.push({
        section,
        cardId: placed.card.cardId,
        printingId: placed.card.printingId,
        quantity: placed.quantity,
      });
    }
  }

  return entries;
}

function draftFromDeck(deck: Deck, cards: readonly Card[]): DeckBuildDraft {
  const byPrintingId = new Map(cards.map((card) => [card.printingId, card]));
  const cardFor = (section: DeckSection) => {
    const entry = deck.entries.find((candidate) => candidate.section === section);

    return entry ? (byPrintingId.get(entry.printingId) ?? null) : null;
  };

  let draft: DeckBuildDraft = {
    ...EMPTY_DRAFT,
    name: deck.name,
    legend: cardFor("legend"),
    chosenChampion:
      deck.chosenChampionCardId === null ? null : (championPrinting(deck, byPrintingId) ?? null),
  };

  for (const entry of deck.entries) {
    if (entry.section === "legend") continue;

    const card = byPrintingId.get(entry.printingId);
    if (!card) continue;

    draft = withZoneCard(draft, entry.section, entry.printingId, {
      card,
      quantity: entry.quantity,
    });
  }

  return draft;
}

function championPrinting(
  deck: Deck,
  byPrintingId: ReadonlyMap<PrintingId, Card>,
): Card | undefined {
  const seated = deck.entries.find(
    (entry) => entry.section === "mainDeck" && entry.cardId === deck.chosenChampionCardId,
  );

  if (!seated) return undefined;

  return byPrintingId.get(seated.printingId);
}

interface PlacedCard {
  readonly card: Card;
  readonly quantity: number;
  readonly section: DeckSection;
}

function placedCards(draft: DeckBuildDraft, section: DeckSection): readonly PlacedCard[] {
  return Object.values(draft.zoneCards[section])
    .filter((placed) => placed.quantity > 0)
    .map((placed) => ({
      card: placed.card,
      quantity: placed.quantity,
      section,
    }))
    .sort((one, other) => one.card.name.localeCompare(other.card.name));
}

function placedCardTotal(placed: readonly PlacedCard[]): number {
  return placed.reduce((total, entry) => total + entry.quantity, 0);
}

/** The champion is a main deck card, so choosing one puts a copy there if none is held yet. */
function chooseChampion(draft: DeckBuildDraft, champion: Card): DeckBuildDraft {
  const held = quantityOf(draft, "mainDeck", champion.printingId);
  const seated = withZoneCard(draft, "mainDeck", champion.printingId, {
    card: champion,
    quantity: Math.max(1, held),
  });

  return { ...seated, chosenChampion: champion };
}

function zoneCounts(draft: DeckBuildDraft): Record<string, number> {
  return draftEntries(draft).reduce<Record<string, number>>((totals, entry) => {
    totals[entry.section] = (totals[entry.section] ?? 0) + entry.quantity;
    return totals;
  }, {});
}

/**
 * Copies of a card held in the given sections, counted across printings: a regular art and an
 * alternate art of the same card draw on one allowance.
 */
function copiesOfName(
  draft: DeckBuildDraft,
  cardId: CardId,
  sections: readonly DeckSection[],
  exclude?: { readonly section: DeckSection; readonly printingId: PrintingId },
): number {
  let total = 0;

  for (const section of sections) {
    for (const placed of Object.values(draft.zoneCards[section])) {
      if (placed.card.cardId !== cardId || placed.quantity <= 0) continue;
      if (exclude && exclude.section === section && exclude.printingId === placed.card.printingId) {
        continue;
      }

      total += placed.quantity;
    }
  }

  return total;
}

export {
  chooseChampion,
  copiesOfName,
  DECK_BUILD_STEPS,
  draftEntries,
  draftFromDeck,
  EMPTY_DRAFT,
  placedCardTotal,
  placedCards,
  quantityOf,
  withZoneCard,
  zoneCounts,
};
export type { DeckBuildDraft, DeckBuildStep, DeckBuildStepId, DraftZoneCard, PlacedCard };
