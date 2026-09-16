import { z } from "zod/v4";

/** The identity of the rules document a device holds. */
const coreRulesEditionSchema = z.object({
  title: z.string().trim().min(1),
  publishedOn: z.string().trim().min(1),
});

function parseCoreRulesEdition(value: unknown): CoreRulesEdition {
  return coreRulesEditionSchema.parse(value);
}

type CoreRulesEdition = z.output<typeof coreRulesEditionSchema>;

export { coreRulesEditionSchema, parseCoreRulesEdition };
export type { CoreRulesEdition };
