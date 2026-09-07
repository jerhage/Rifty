import type { Clock } from "@/application/ports/clock";

import { parseDeck, type Deck, type DeckId, type DeckName } from "../deck";
import type { DeckFinder } from "../deck-finder";
import type { DeckLister } from "../deck-lister";
import type { DeckSaver } from "../deck-saver";

type RenameDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "notFound" }
  | { readonly type: "nameTaken" }
  | { readonly type: "saveFailed" };

interface RenameDeckCapabilities {
  readonly clock: Clock;
  readonly deckFinder: DeckFinder;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
}

async function renameDeck(
  id: DeckId,
  name: DeckName,
  { clock, deckFinder, deckLister, deckSaver }: RenameDeckCapabilities,
): Promise<RenameDeckResult> {
  try {
    const current = await deckFinder.get(id);
    if (!current) return { type: "notFound" };

    const wanted = name.trim().toLowerCase();
    const existing = await deckLister.getAll();
    // Restyling a deck's own capitalization is not a clash with itself.
    if (existing.some((deck) => deck.id !== id && deck.name.trim().toLowerCase() === wanted)) {
      return { type: "nameTaken" };
    }

    const deck = parseDeck({ ...current, name, updatedAt: clock.now() });
    await deckSaver.save(deck);

    return { type: "success", deck };
  } catch {
    return { type: "saveFailed" };
  }
}

export { renameDeck };
export type { RenameDeckCapabilities, RenameDeckResult };
