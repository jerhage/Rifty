import type { Card } from "@/features/catalog/card/card";

interface CardCopy {
  readonly card: Card;
  readonly quantity: number;
}

export type { CardCopy };
