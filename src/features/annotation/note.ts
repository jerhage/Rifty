import { z } from "zod/v4";

import { annotationSubjectSchema } from "./value-objects/annotation-subject";

const noteIdSchema = z.string().trim().min(1);
const noteTitleSchema = z.string().trim();
const noteBodySchema = z.string().trim().min(1);

/** A note with no subject stands alone, and a subject may collect as many as a person writes. */
const noteSchema = z.object({
  id: noteIdSchema,
  subject: annotationSubjectSchema.nullable(),
  title: noteTitleSchema,
  body: noteBodySchema,
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
});

function parseNote(value: unknown): Note {
  return noteSchema.parse(value);
}

type NoteId = z.output<typeof noteIdSchema>;
type Note = z.output<typeof noteSchema>;

export { noteBodySchema, noteIdSchema, noteSchema, noteTitleSchema, parseNote };
export type { Note, NoteId };
