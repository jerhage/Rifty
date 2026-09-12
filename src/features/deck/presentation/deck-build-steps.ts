import type { Card } from "@/features/card/card";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import {
  DECK_SECTIONS,
  type DeckComposition,
  type DeckEntry,
  type DeckSection,
} from "@/features/deck/deck/deck";
import type { ResolvedDeck } from "@/features/deck/deck/resolved-deck";

type DeckBuildStepId = "legend" | "chosenChampion" | "zones";

interface DeckBuildStep {
  readonly id: DeckBuildStepId;
  readonly ordinal: number;
  readonly label: string;
  readonly title: string;
  readonly blurb: string;
}

const DECK_BUILD_STEPS_BY_ID: Readonly<Record<DeckBuildStepId, DeckBuildStep>> = {
  legend: {
    id: "legend",
    ordinal: 1,
    label: "Legend",
    title: "Pick your Legend",
    blurb:
      "Starts the game in play and sets which domains your 40 can pull from. It sits outside every count.",
  },
  chosenChampion: {
    id: "chosenChampion",
    ordinal: 2,
    label: "Chosen Champion",
    title: "Name your Champion",
    blurb:
      "One champion unit is your Chosen Champion. It starts in the champion zone and shares its three copies with the main deck.",
  },
  zones: {
    id: "zones",
    ordinal: 3,
    label: "Zones",
    title: "Build zones",
    blurb: "Fill each zone, then check the deck before you save it.",
  },
};

const DECK_BUILD_STEPS: readonly DeckBuildStep[] = [
  DECK_BUILD_STEPS_BY_ID.legend,
  DECK_BUILD_STEPS_BY_ID.chosenChampion,
  DECK_BUILD_STEPS_BY_ID.zones,
];

function stepFor(id: DeckBuildStepId): DeckBuildStep {
  return DECK_BUILD_STEPS_BY_ID[id];
}

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

/** The draft reduced to the shape the deck's own rules read. */
function draftComposition(draft: DeckBuildDraft): DeckComposition {
  return {
    entries: draftEntries(draft),
    chosenChampionCardId: draft.chosenChampion?.cardId ?? null,
  };
}

function draftFromDeck({ chosenChampionCard, deck, entries }: ResolvedDeck): DeckBuildDraft {
  let draft: DeckBuildDraft = {
    ...EMPTY_DRAFT,
    name: deck.name,
    legend: entries.find((entry) => entry.section === "legend")?.card ?? null,
    chosenChampion: chosenChampionCard,
  };

  for (const entry of entries) {
    if (entry.section === "legend") continue;

    draft = withZoneCard(draft, entry.section, entry.card.printingId, {
      card: entry.card,
      quantity: entry.quantity,
    });
  }

  return draft;
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

export {
  chooseChampion,
  DECK_BUILD_STEPS,
  draftComposition,
  draftFromDeck,
  EMPTY_DRAFT,
  placedCardTotal,
  placedCards,
  quantityOf,
  stepFor,
  withZoneCard,
  zoneCounts,
};
export type { DeckBuildDraft, DeckBuildStep, DeckBuildStepId, DraftZoneCard, PlacedCard };
