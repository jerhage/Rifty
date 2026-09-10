import { z } from "zod/v4";

const marketplaceSchema = z.enum(["cardmarket", "tcgplayer"]);
const marketplaceReferenceSchema = z.object({
  marketplace: marketplaceSchema,
  externalId: z.string().trim().min(1),
});

type Marketplace = z.output<typeof marketplaceSchema>;
type MarketplaceReference = z.output<typeof marketplaceReferenceSchema>;

export { marketplaceReferenceSchema, marketplaceSchema };
export type { Marketplace, MarketplaceReference };
