import { z } from "zod/v4";

import { annotationSubjectSchema } from "./value-objects/annotation-subject";

/**
 * Which notes a read asks for. `standalone` is the notes with no subject at all, which is a scope
 * of its own rather than the absence of one.
 */
const noteListScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("standalone") }),
  z.object({ type: z.literal("onSubject"), subject: annotationSubjectSchema }),
]);

type NoteListScope = z.output<typeof noteListScopeSchema>;

export { noteListScopeSchema };
export type { NoteListScope };
