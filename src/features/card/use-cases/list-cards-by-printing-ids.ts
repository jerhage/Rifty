import type { ReadOptions } from "@/shared/read-options";

import type { Card } from "../card";
import type { CardsByPrintingIdsFinder } from "../cards-by-printing-ids-finder";
import type { PrintingId } from "../value-objects/printing-id";

type ListCardsByPrintingIdsResult = {
  readonly type: "success";
  readonly cards: readonly Card[];
};

interface ListCardsByPrintingIdsCapabilities {
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
}

async function listCardsByPrintingIds(
  printingIds: readonly PrintingId[],
  { cardsByPrintingIdsFinder }: ListCardsByPrintingIdsCapabilities,
  options?: ReadOptions,
): Promise<ListCardsByPrintingIdsResult> {
  const cards = await cardsByPrintingIdsFinder.getAllByPrintingIds(printingIds, options);

  return { type: "success", cards };
}

export { listCardsByPrintingIds };
export type { ListCardsByPrintingIdsCapabilities, ListCardsByPrintingIdsResult };
