import { z } from "zod/v4";

import { taxonomyIdSchema, type TaxonomyId } from "../value-objects/taxonomy-id";

/** One or more domains that every returned card must belong to. */
const cardDomainSelectionSchema = z.union([taxonomyIdSchema, z.array(taxonomyIdSchema).min(1)]);

type CardDomainSelection = z.output<typeof cardDomainSelectionSchema>;

function normalizeCardDomainSelection(selection: CardDomainSelection): readonly TaxonomyId[] {
  const parsedSelection = cardDomainSelectionSchema.parse(selection);
  const domainIds = Array.isArray(parsedSelection) ? parsedSelection : [parsedSelection];

  return [...new Set(domainIds)];
}

export { cardDomainSelectionSchema, normalizeCardDomainSelection };
export type { CardDomainSelection };
