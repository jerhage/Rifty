import { z } from "zod/v4";

import { annotationSubjectKindSchema } from "./value-objects/annotation-subject";

/**
 * Which bookmarks a read asks for. The store turns this into a where clause; a caller never reads
 * every bookmark and narrows the result itself.
 */
const bookmarkListScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("ofKind"), kind: annotationSubjectKindSchema }),
]);

type BookmarkListScope = z.output<typeof bookmarkListScopeSchema>;

export { bookmarkListScopeSchema };
export type { BookmarkListScope };
