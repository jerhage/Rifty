import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

type CardListKeyCriteria = Omit<CardListCriteria, "limit" | "offset">;

const cardKeys = {
  all: () => ["card"] as const,
  details: () => [...cardKeys.all(), "detail"] as const,
  detail: (printingId: PrintingId) => [...cardKeys.details(), printingId] as const,
  keywords: () => [...cardKeys.all(), "keyword"] as const,
  lists: () => [...cardKeys.all(), "list"] as const,
  list: (criteria: CardListKeyCriteria) => [...cardKeys.lists(), criteria] as const,
  lookups: () => [...cardKeys.all(), "lookup"] as const,
  lookup: (printingIds: readonly PrintingId[]) => [...cardKeys.lookups(), printingIds] as const,
  summaries: () => [...cardKeys.all(), "summary"] as const,
  summaryList: (criteria: CardListKeyCriteria) => [...cardKeys.summaries(), criteria] as const,
};

export { cardKeys };
export type { CardListKeyCriteria };
