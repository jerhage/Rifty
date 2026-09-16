import { z } from "zod/v4";

import { annotationSubjectSchema } from "./value-objects/annotation-subject";

/**
 * A subject carries one mark or none, so the subject is the identity and there is no separate id
 * to hold. `createdAt` is when the mark was made, which stays true if the mark is made again.
 */
const bookmarkSchema = z.object({
  subject: annotationSubjectSchema,
  createdAt: z.string().trim().min(1),
});

function parseBookmark(value: unknown): Bookmark {
  return bookmarkSchema.parse(value);
}

type Bookmark = z.output<typeof bookmarkSchema>;

export { bookmarkSchema, parseBookmark };
export type { Bookmark };
