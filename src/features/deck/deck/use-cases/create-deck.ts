import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";

import { deckNameSchema, parseDeck, type Deck, type DeckName } from "../deck";
import type { DeckLister } from "../deck-lister";
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

/**
 * Two decks whose names differ only in capitalization would look identical in a list, so the check
 * ignores case. That is stricter than the unique index behind it.
 */
async function createDeck(
  name: string,
  { clock, deckLister, deckSaver, idGenerator }: CreateDeckCapabilities,
): Promise<CreateDeckResult> {
  const parsedName = deckNameSchema.safeParse(name);
  if (!parsedName.success) return { type: "nameMissing" };
  if (await isNameTaken(parsedName.data, deckLister)) return { type: "nameTaken" };

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

async function isNameTaken(name: DeckName, deckLister: DeckLister): Promise<boolean> {
  const existing = await deckLister.getAll();
  const wanted = name.toLowerCase();

  return existing.some((deck) => deck.name.trim().toLowerCase() === wanted);
}

export { createDeck };
export type { CreateDeckCapabilities, CreateDeckResult };
