import type { Clock } from "@/application/ports/clock";

import {
  parseDeck,
  type CardId,
  type Deck,
  type DeckId,
  type DeckSection,
  type PrintingId,
} from "../deck";
import type { DeckFinder } from "../deck-finder";
import { remainingCopies } from "../deck-legality";
import type { DeckSaver } from "../deck-saver";

type SetDeckCardQuantityResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "notFound" }
  | { readonly type: "copyLimitReached"; readonly allowed: number }
  | { readonly type: "saveFailed" };

interface DeckCardQuantity {
  readonly section: DeckSection;
  readonly cardId: CardId;
  readonly printingId: PrintingId;
  /** Zero removes the card from that section; the schema stores positive quantities only. */
  readonly quantity: number;
}

interface SetDeckCardQuantityCapabilities {
  readonly clock: Clock;
  readonly deckFinder: DeckFinder;
  readonly deckSaver: DeckSaver;
}

/**
 * Copy limits are enforced here, unlike zone sizes: a deck is allowed to sit at 38 of 40 while you
 * work on it, but a fourth copy of a card is never a legal position to pass through.
 */
async function setDeckCardQuantity(
  id: DeckId,
  { cardId, printingId, quantity, section }: DeckCardQuantity,
  { clock, deckFinder, deckSaver }: SetDeckCardQuantityCapabilities,
): Promise<SetDeckCardQuantityResult> {
  try {
    const current = await deckFinder.get(id);
    if (!current) return { type: "notFound" };

    const allowed = remainingCopies(current, section, cardId, printingId);
    if (allowed !== null && quantity > allowed) return { type: "copyLimitReached", allowed };

    const others = current.entries.filter(
      (entry) =>
        entry.section !== section || entry.cardId !== cardId || entry.printingId !== printingId,
    );
    const deck = parseDeck({
      ...current,
      entries: quantity > 0 ? [...others, { section, cardId, printingId, quantity }] : others,
      updatedAt: clock.now(),
    });
    await deckSaver.save(deck);

    return { type: "success", deck };
  } catch {
    return { type: "saveFailed" };
  }
}

export { setDeckCardQuantity };
export type { DeckCardQuantity, SetDeckCardQuantityCapabilities, SetDeckCardQuantityResult };
