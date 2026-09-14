import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { ReadOptions } from "@/shared/read-options";
import type { Card } from "../card";
import type { CardFinder } from "../card-finder";

type FindCardResult =
  | { readonly type: "success"; readonly card: Card }
  | { readonly type: "notFound" };

interface FindCardCapabilities {
  readonly cardFinder: CardFinder;
}

async function findCard(
  printingId: PrintingId,
  { cardFinder }: FindCardCapabilities,
  options?: ReadOptions,
): Promise<FindCardResult> {
  const card = await cardFinder.get(printingId, options);
  return card ? { type: "success", card } : { type: "notFound" };
}

export { findCard };
export type { FindCardCapabilities, FindCardResult };
