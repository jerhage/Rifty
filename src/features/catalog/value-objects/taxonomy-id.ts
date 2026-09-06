import { z } from "zod/v4";

const taxonomyIdSchema = z.string().trim().min(1);

type TaxonomyId = z.output<typeof taxonomyIdSchema>;

export { taxonomyIdSchema };
export type { TaxonomyId };
