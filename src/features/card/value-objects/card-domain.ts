import { z } from "zod/v4";

const cardDomainSchema = z.enum(["Body", "Calm", "Chaos", "Colorless", "Fury", "Mind", "Order"]);

type CardDomain = z.output<typeof cardDomainSchema>;

/**
 * Chips read in play order rather than the schema's alphabetical order. The rank is keyed by the
 * full union, so adding a domain is a compile error here until it is given a position.
 */
const DOMAIN_RANK: Readonly<Record<CardDomain, number>> = {
  Body: 0,
  Calm: 1,
  Chaos: 2,
  Fury: 3,
  Mind: 4,
  Order: 5,
  Colorless: 6,
};

const ORDERED_DOMAINS = [...cardDomainSchema.options].sort(
  (left, right) => DOMAIN_RANK[left] - DOMAIN_RANK[right],
);

export { cardDomainSchema, ORDERED_DOMAINS };
export type { CardDomain };
