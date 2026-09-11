import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

type CardListKeyCriteria = Omit<CardListCriteria, "limit" | "offset">;

const cardKeys = {
  all: () => ["card"] as const,
  detail: (printingId: PrintingId) => [...cardKeys.all(), "detail", printingId] as const,
  keywords: () => [...cardKeys.all(), "keyword"] as const,
  list: (criteria: CardListKeyCriteria) => [...cardKeys.all(), "list", criteria] as const,
  summaryList: (criteria: CardListKeyCriteria) => [...cardKeys.all(), "summary", criteria] as const,
};

export { cardKeys };
export type { CardListKeyCriteria };
