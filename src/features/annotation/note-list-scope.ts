import { z } from "zod/v4";

import {
  annotationSubjectKindSchema,
  annotationSubjectSchema,
} from "./value-objects/annotation-subject";

/**
 * Which notes a read asks for. `ofKind` is every note on any subject of one kind, so a screen
 * holding a document's worth of subjects asks once rather than once per row.
 */
const noteListScopeSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("all") }),
    z.object({ type: z.literal("ofKind"), kind: annotationSubjectKindSchema }),
    z.object({ type: z.literal("onSubject"), subject: annotationSubjectSchema }),
  ])
  .readonly();

type NoteListScope = z.output<typeof noteListScopeSchema>;

export { noteListScopeSchema };
export type { NoteListScope };
