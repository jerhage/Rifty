import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { ReadOptions } from "@/shared/read-options";

import type { Deck, DeckId } from "../deck";
import type { DeckFinder } from "../deck-finder";
import type { ResolvedDeck, ResolvedDeckEntry } from "../resolved-deck";

import { findDeck, type FindDeckResult } from "./find-deck";

type FindResolvedDeckResult =
  | { readonly type: "success"; readonly resolvedDeck: ResolvedDeck }
  | { readonly type: "notFound" };

interface FindResolvedDeckCapabilities {
  readonly cardByCardIdFinder: CardByCardIdFinder;
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
  readonly deckFinder: DeckFinder;
}

/**
 * Every entry names a printing the catalog is required to hold, so an entry that fails to resolve
 * is a violated invariant rather than an outcome a caller can act on.
 */
async function findResolvedDeck(
  id: DeckId,
  capabilities: FindResolvedDeckCapabilities,
  options?: ReadOptions,
): Promise<FindResolvedDeckResult> {
  const found = await findDeck(id, { deckFinder: capabilities.deckFinder }, options);

  return await match<FindDeckResult, Promise<FindResolvedDeckResult>>(found)
    .with({ type: "notFound" }, async (missing) => missing)
    .with({ type: "success" }, ({ deck }) => resolvedDeckFor(deck, capabilities, options))
    .exhaustive();
}

async function resolvedDeckFor(
  deck: Deck,
  capabilities: FindResolvedDeckCapabilities,
  options?: ReadOptions,
): Promise<FindResolvedDeckResult> {
  const entries = await resolvedEntries(deck, capabilities, options);

  return {
    type: "success",
    resolvedDeck: {
      deck,
      entries,
      chosenChampionCard: await chosenChampionCard(deck, entries, capabilities, options),
    },
  };
}

async function resolvedEntries(
  deck: Deck,
  { cardsByPrintingIdsFinder }: FindResolvedDeckCapabilities,
  options?: ReadOptions,
): Promise<readonly ResolvedDeckEntry[]> {
  const printingIds = [...new Set(deck.entries.map((entry) => entry.printingId))];
  const cards =
    printingIds.length === 0
      ? []
      : await cardsByPrintingIdsFinder.getAllByPrintingIds(printingIds, options);
  const byPrintingId = new Map(cards.map((card) => [card.printingId, card]));

  return deck.entries.map((entry) => {
    const card = byPrintingId.get(entry.printingId);
    if (!card) {
      throw new Error(
        `Deck ${deck.id} names printing ${entry.printingId}, which the catalog does not hold.`,
      );
    }

    return { section: entry.section, card, quantity: entry.quantity };
  });
}

async function chosenChampionCard(
  deck: Deck,
  entries: readonly ResolvedDeckEntry[],
  { cardByCardIdFinder }: FindResolvedDeckCapabilities,
  options?: ReadOptions,
): Promise<Card | null> {
  const cardId = deck.chosenChampionCardId;
  if (cardId === null) return null;

  const seated = entries.find(
    (entry) => entry.section === "mainDeck" && entry.card.cardId === cardId,
  );
  if (seated) return seated.card;

  const card = await cardByCardIdFinder.getByCardId(cardId, options);
  if (!card) {
    throw new Error(`Deck ${deck.id} names champion ${cardId}, which the catalog does not hold.`);
  }

  return card;
}

export { findResolvedDeck };
export type { FindResolvedDeckCapabilities, FindResolvedDeckResult };
