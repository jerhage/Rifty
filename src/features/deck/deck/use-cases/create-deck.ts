import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";

import { deckNameSchema, parseDeck, type Deck } from "../deck";
import type { DeckLister } from "../deck-lister";
import { isDeckNameTaken } from "../deck-naming";
import type { DeckSaver } from "../deck-saver";

type CreateDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "nameMissing" }
  | { readonly type: "nameTaken" };

interface CreateDeckCapabilities {
  readonly clock: Clock;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

async function createDeck(
  name: string,
  { clock, deckLister, deckSaver, idGenerator }: CreateDeckCapabilities,
): Promise<CreateDeckResult> {
  const parsedName = deckNameSchema.safeParse(name);
  if (!parsedName.success) return { type: "nameMissing" };
  if (isDeckNameTaken(parsedName.data, await deckLister.getAll(), null)) {
    return { type: "nameTaken" };
  }

  const createdAt = clock.now();
  const deck = parseDeck({
    id: idGenerator.next(),
    name: parsedName.data,
    notes: "",
    createdAt,
    updatedAt: createdAt,
    chosenChampionCardId: null,
    entries: [],
  });
  await deckSaver.save(deck);

  return { type: "success", deck };
}

export { createDeck };
export type { CreateDeckCapabilities, CreateDeckResult };
