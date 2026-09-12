import type { Card } from "@/features/card/card";
import { spokenCardTypeAndAttributes } from "@/features/card/presentation/card-taxonomy-format";

/** What a builder row or tile announces: the card, its stats spelled out, and how many it holds. */
function buildCardLabel(card: Card, quantity: number): string {
  const held = quantity === 0 ? "none in deck" : `${quantity} in deck`;

  return `${card.name}, ${spokenCardTypeAndAttributes(card)}, ${held}`;
}

export { buildCardLabel };
