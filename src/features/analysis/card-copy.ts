import type { Card } from "@/features/card/card";

interface CardCopy {
  readonly card: Card;
  readonly quantity: number;
}

/** Sums the quantities of a multiset of cards. */
function copyCount(copies: readonly CardCopy[]): number {
  return copies.reduce((total, entry) => total + entry.quantity, 0);
}

export { copyCount };
export type { CardCopy };
