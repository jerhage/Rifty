import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { ReadOptions } from "@/shared/read-options";
import type { Card } from "../card";
import type { CardFinder } from "../card-finder";

type FindCardResult =
  | { readonly type: "success"; readonly card: Card }
  | { readonly type: "notFound" }
  | { readonly type: "loadFailed" };

interface FindCardCapabilities {
  readonly cardFinder: CardFinder;
}

async function findCard(
  id: PrintingId,
  { cardFinder }: FindCardCapabilities,
  options?: ReadOptions,
): Promise<FindCardResult> {
  try {
    const card = await cardFinder.get(id, options);
    return card ? { type: "success", card } : { type: "notFound" };
  } catch {
    return { type: "loadFailed" };
  }
}

export { findCard };
export type { FindCardCapabilities, FindCardResult };
