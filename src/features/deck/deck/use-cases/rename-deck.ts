import type { Clock } from "@/application/ports/clock";

import { deckNameSchema, parseDeck, type Deck, type DeckId } from "../deck";
import type { DeckFinder } from "../deck-finder";
import type { DeckLister } from "../deck-lister";
import { isDeckNameTaken } from "../deck-naming";
import type { DeckSaver } from "../deck-saver";

type RenameDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "notFound" }
  | { readonly type: "nameMissing" }
  | { readonly type: "nameTaken" };

interface RenameDeckCapabilities {
  readonly clock: Clock;
  readonly deckFinder: DeckFinder;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
}

async function renameDeck(
  id: DeckId,
  name: string,
  { clock, deckFinder, deckLister, deckSaver }: RenameDeckCapabilities,
): Promise<RenameDeckResult> {
  const parsedName = deckNameSchema.safeParse(name);
  if (!parsedName.success) return { type: "nameMissing" };

  const current = await deckFinder.get(id);
  if (!current) return { type: "notFound" };

  if (isDeckNameTaken(parsedName.data, await deckLister.getAll(), id)) {
    return { type: "nameTaken" };
  }

  const deck = parseDeck({ ...current, name: parsedName.data, updatedAt: clock.now() });
  await deckSaver.save(deck);

  return { type: "success", deck };
}

export { renameDeck };
export type { RenameDeckCapabilities, RenameDeckResult };
