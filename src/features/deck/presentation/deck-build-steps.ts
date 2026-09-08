import type { Card } from "@/features/catalog/card/card";
import { cardIdentityName } from "@/features/catalog/presentation/card-identity";
import type { Deck, DeckEntry, DeckSection } from "@/features/deck/deck/deck";

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
  /** Cards placed in the four buildable zones, keyed by section and printing. */
  readonly zoneCards: Readonly<Record<string, DraftZoneCard>>;
}

const EMPTY_DRAFT: DeckBuildDraft = {
  name: "",
  legend: null,
  chosenChampion: null,
  zoneCards: {},
};

const KEY_SEPARATOR = " ";

function quantityKey(section: DeckSection, cardRiftboundId: string): string {
  return `${section}${KEY_SEPARATOR}${cardRiftboundId}`;
}

function quantityOf(draft: DeckBuildDraft, section: DeckSection, cardRiftboundId: string): number {
  return draft.zoneCards[quantityKey(section, cardRiftboundId)]?.quantity ?? 0;
}

function draftEntries(draft: DeckBuildDraft): DeckEntry[] {
  const entries: DeckEntry[] = [];

  if (draft.legend) {
    entries.push({ section: "legend", cardRiftboundId: draft.legend.riftboundId, quantity: 1 });
  }
  if (draft.chosenChampion) {
    entries.push({
      section: "chosenChampion",
      cardRiftboundId: draft.chosenChampion.riftboundId,
      quantity: 1,
    });
  }

  for (const [key, placed] of Object.entries(draft.zoneCards)) {
    if (placed.quantity <= 0) continue;

    const separatorIndex = key.indexOf(KEY_SEPARATOR);
    if (separatorIndex < 0) continue;

    entries.push({
      section: key.slice(0, separatorIndex) as DeckSection,
      cardRiftboundId: key.slice(separatorIndex + 1),
      quantity: placed.quantity,
    });
  }

  return entries;
}

function draftFromDeck(deck: Deck, cards: readonly Card[]): DeckBuildDraft {
  const byRiftboundId = new Map(cards.map((card) => [card.riftboundId, card]));
  const cardFor = (section: DeckSection) => {
    const entry = deck.entries.find((candidate) => candidate.section === section);

    return entry ? (byRiftboundId.get(entry.cardRiftboundId) ?? null) : null;
  };

  const zoneCards: Record<string, DraftZoneCard> = {};
  for (const entry of deck.entries) {
    if (entry.section === "legend" || entry.section === "chosenChampion") continue;

    const card = byRiftboundId.get(entry.cardRiftboundId);
    if (!card) continue;

    zoneCards[quantityKey(entry.section, entry.cardRiftboundId)] = {
      card,
      quantity: entry.quantity,
    };
  }

  return {
    name: deck.name,
    legend: cardFor("legend"),
    chosenChampion: cardFor("chosenChampion"),
    zoneCards,
  };
}

function deckCardTotal(draft: DeckBuildDraft): number {
  return draftEntries(draft)
    .filter((entry) => entry.section !== "legend")
    .reduce((total, entry) => total + entry.quantity, 0);
}

/** The chosen champion starts in its own zone but occupies one of the main deck's forty. */
function zoneCounts(draft: DeckBuildDraft): Record<string, number> {
  const counts = draftEntries(draft).reduce<Record<string, number>>((totals, entry) => {
    totals[entry.section] = (totals[entry.section] ?? 0) + entry.quantity;
    return totals;
  }, {});

  if (draft.chosenChampion) counts.mainDeck = (counts.mainDeck ?? 0) + 1;

  return counts;
}

/**
 * Copies of a card held in the given sections, counted across printings: a regular art and an
 * alternate art of the same card draw on one allowance.
 */
function copiesOfName(
  draft: DeckBuildDraft,
  identityName: string,
  sections: readonly DeckSection[],
  exclude?: { readonly section: DeckSection; readonly cardRiftboundId: string },
): number {
  let total = 0;

  if (
    draft.chosenChampion &&
    cardIdentityName(draft.chosenChampion) === identityName &&
    sections.includes("chosenChampion")
  ) {
    total += 1;
  }

  for (const [key, placed] of Object.entries(draft.zoneCards)) {
    if (cardIdentityName(placed.card) !== identityName || placed.quantity <= 0) continue;

    const separatorIndex = key.indexOf(KEY_SEPARATOR);
    const section = key.slice(0, separatorIndex) as DeckSection;
    const cardRiftboundId = key.slice(separatorIndex + 1);

    if (!sections.includes(section)) continue;
    if (exclude && exclude.section === section && exclude.cardRiftboundId === cardRiftboundId) {
      continue;
    }

    total += placed.quantity;
  }

  return total;
}

export {
  copiesOfName,
  deckCardTotal,
  DECK_BUILD_STEPS,
  draftEntries,
  draftFromDeck,
  EMPTY_DRAFT,
  quantityKey,
  quantityOf,
  zoneCounts,
};
export type { DeckBuildDraft, DeckBuildStep, DeckBuildStepId, DraftZoneCard };
