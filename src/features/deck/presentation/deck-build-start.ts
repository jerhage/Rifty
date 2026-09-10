import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Card } from "@/features/card/card";
import type { Deck } from "@/features/deck/deck/deck";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";

interface DeckBuildCapabilities {
  readonly clock: Clock;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

type DeckBuildStart =
  | { readonly type: "new" }
  | { readonly type: "edit"; readonly deck: Deck; readonly cards: readonly Card[] };

type DeckBuildMode = DeckBuildStart["type"];

export type { DeckBuildCapabilities, DeckBuildMode, DeckBuildStart };
