import { match, P } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { CardId } from "@/features/card/value-objects/card-id";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

import { parseDeck, type Deck, type DeckId, type DeckSection } from "../deck";
import type { DeckFinder } from "../deck-finder";
import { remainingCopies } from "../deck-legality";
import type { DeckSaver } from "../deck-saver";

type SetDeckCardQuantityResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "notFound" }
  | { readonly type: "copyLimitReached"; readonly allowed: number };

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
 * Copy limits are enforced here, unlike section sizes: a deck is allowed to sit at 38 of 40 while you
 * work on it, but a fourth copy of a card is never a legal position to pass through.
 */
async function setDeckCardQuantity(
  id: DeckId,
  quantityRequest: DeckCardQuantity,
  { clock, deckFinder, deckSaver }: SetDeckCardQuantityCapabilities,
): Promise<SetDeckCardQuantityResult> {
  const { cardId, printingId, quantity, section } = quantityRequest;

  const current = await deckFinder.get(id);
  if (!current) return { type: "notFound" };

  return await match(remainingCopies(current.entries, section, cardId, printingId))
    .with(
      { type: "limited", copies: P.number.lt(quantity) },
      ({ copies }): SetDeckCardQuantityResult => ({ type: "copyLimitReached", allowed: copies }),
    )
    .with({ type: "limited" }, { type: "unlimited" }, () =>
      savedWithQuantity(current, quantityRequest, { clock, deckSaver }),
    )
    .exhaustive();
}

async function savedWithQuantity(
  current: Deck,
  { cardId, printingId, quantity, section }: DeckCardQuantity,
  { clock, deckSaver }: Pick<SetDeckCardQuantityCapabilities, "clock" | "deckSaver">,
): Promise<SetDeckCardQuantityResult> {
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
}

export { setDeckCardQuantity };
export type { DeckCardQuantity, SetDeckCardQuantityCapabilities, SetDeckCardQuantityResult };
