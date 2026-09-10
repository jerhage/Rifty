import type { Card } from "@/features/card/card";

interface CardCopy {
  readonly card: Card;
  readonly quantity: number;
}

export type { CardCopy };
