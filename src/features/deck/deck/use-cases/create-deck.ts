import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";

import { parseDeck, type Deck, type DeckName } from "../deck";
import type { DeckLister } from "../deck-lister";
import type { DeckSaver } from "../deck-saver";

type CreateDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "nameTaken" }
  | { readonly type: "saveFailed" };

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
  name: DeckName,
  { clock, deckLister, deckSaver, idGenerator }: CreateDeckCapabilities,
): Promise<CreateDeckResult> {
  try {
    if (await isNameTaken(name, deckLister)) return { type: "nameTaken" };

    const createdAt = clock.now();
    const deck = parseDeck({
      id: idGenerator.next(),
      name,
      notes: "",
      createdAt,
      updatedAt: createdAt,
      chosenChampionRiftboundId: null,
      entries: [],
    });
    await deckSaver.save(deck);

    return { type: "success", deck };
  } catch {
    return { type: "saveFailed" };
  }
}

async function isNameTaken(name: DeckName, deckLister: DeckLister): Promise<boolean> {
  const existing = await deckLister.getAll();
  const wanted = name.trim().toLowerCase();

  return existing.some((deck) => deck.name.trim().toLowerCase() === wanted);
}

export { createDeck };
export type { CreateDeckCapabilities, CreateDeckResult };
