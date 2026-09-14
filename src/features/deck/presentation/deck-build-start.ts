import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import type { ResolvedDeck } from "@/features/deck/deck/resolved-deck";

interface DeckBuildCapabilities {
  readonly clock: Clock;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

type DeckBuildStart =
  | { readonly type: "create" }
  | { readonly type: "edit"; readonly resolvedDeck: ResolvedDeck };

type DeckBuildMode = DeckBuildStart["type"];

export type { DeckBuildCapabilities, DeckBuildMode, DeckBuildStart };
