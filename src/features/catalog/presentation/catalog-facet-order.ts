import { cardDomainSchema, type CardDomain } from "@/features/catalog/value-objects/card-domain";
import { cardTypeSchema, type CardType } from "@/features/catalog/value-objects/card-type";

/**
 * Chips read in play order rather than the schema's alphabetical order. Both ranks are keyed by the
 * full union, so adding a domain or card type is a compile error here until it is given a position.
 */
const domainRank: Record<CardDomain, number> = {
  Body: 0,
  Calm: 1,
  Chaos: 2,
  Fury: 3,
  Mind: 4,
  Order: 5,
  Colorless: 6,
};

const typeRank: Record<CardType, number> = {
  Unit: 0,
  Spell: 1,
  Gear: 2,
  Legend: 3,
  Battlefield: 4,
  Rune: 5,
};

const orderedDomains = [...cardDomainSchema.options].sort(
  (left, right) => domainRank[left] - domainRank[right],
);

const orderedCardTypes = [...cardTypeSchema.options].sort(
  (left, right) => typeRank[left] - typeRank[right],
);

export { orderedCardTypes, orderedDomains };
