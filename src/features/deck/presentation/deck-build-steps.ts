import type { CardSummary } from "@/features/catalog/card/card-summary";
import type { DeckEntry } from "@/features/deck/deck/deck";

type DeckBuildStepId = "legend" | "chosenChampion" | "zones";

interface DeckBuildStep {
  readonly id: DeckBuildStepId;
  readonly label: string;
  readonly title: string;
  readonly blurb: string;
}

const deckBuildSteps: readonly DeckBuildStep[] = [
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
    blurb: "Your headline card. It has to appear in the main deck as well.",
  },
  {
    id: "zones",
    label: "Zones",
    title: "Build zones",
    blurb: "Fill each zone, then check the deck before you save it.",
  },
];

interface DeckBuildDraft {
  readonly name: string;
  readonly legend: CardSummary | null;
  readonly chosenChampion: CardSummary | null;
}

/**
 * Both picks are optional: the design lets you skip either and come back, and a deck saves whether
 * or not it is legal.
 */
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

  return entries;
}

export { deckBuildSteps, draftEntries };
export type { DeckBuildDraft, DeckBuildStep, DeckBuildStepId };
