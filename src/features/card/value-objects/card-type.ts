import { z } from "zod/v4";

const cardTypeSchema = z.enum([
  "Battlefield",
  "Gear",
  "Legend",
  "Other",
  "Rune",
  "Spell",
  "Token",
  "Unit",
]);

type CardType = z.output<typeof cardTypeSchema>;

/**
 * Chips read in play order rather than the schema's alphabetical order. The rank is keyed by the
 * full union, so adding a card type is a compile error here until it is given a position.
 */
const TYPE_RANK: Record<CardType, number> = {
  Unit: 0,
  Spell: 1,
  Gear: 2,
  Legend: 3,
  Battlefield: 4,
  Rune: 5,
  Other: 6,
  Token: 7,
};

const ORDERED_CARD_TYPES = [...cardTypeSchema.options].sort(
  (left, right) => TYPE_RANK[left] - TYPE_RANK[right],
);

export { cardTypeSchema, ORDERED_CARD_TYPES };
export type { CardType };
