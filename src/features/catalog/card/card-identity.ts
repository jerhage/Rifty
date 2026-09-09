import type { Card } from "@/features/catalog/card/card";

/**
 * Printings of one card differ by a trailing qualifier — "(Alternate Art)", "(Signature)",
 * "(Overnumbered)", "(Metal)" and so on. Deck copy limits count the card, not the printing, so the
 * qualifier comes off before anything is compared.
 */
function cardIdentityName(card: Pick<Card, "name">): string {
  return card.name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export { cardIdentityName };
