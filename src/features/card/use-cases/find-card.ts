import type { Card, CardId } from "../card";
import type { CardFinder } from "../card-finder";

type FindCardResult =
  | { readonly type: "success"; readonly card: Card }
  | { readonly type: "notFound" }
  | { readonly type: "loadFailed" };

interface FindCardCapabilities {
  readonly cardFinder: CardFinder;
}

async function findCard(id: CardId, { cardFinder }: FindCardCapabilities): Promise<FindCardResult> {
  try {
    const card = await cardFinder.get(id);
    return card ? { type: "success", card } : { type: "notFound" };
  } catch {
    return { type: "loadFailed" };
  }
}

export { findCard };
export type { FindCardCapabilities, FindCardResult };
