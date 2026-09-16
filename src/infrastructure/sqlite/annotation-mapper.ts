import { parseBookmark, type Bookmark } from "@/features/annotation/bookmark";
import { parseNote, type Note } from "@/features/annotation/note";
import {
  bookmarkSelectSchema,
  noteSelectSchema,
} from "@/infrastructure/database/annotation-schema/annotations";

function toDomainBookmark(row: unknown): Bookmark {
  const persisted = bookmarkSelectSchema.parse(row);

  return parseBookmark({
    subject: { kind: persisted.subjectKind, id: persisted.subjectId },
    createdAt: persisted.createdAt,
  });
}

/** The table's check constraint keeps the subject pair whole, so one half implies the other. */
function toDomainNote(row: unknown): Note {
  const persisted = noteSelectSchema.parse(row);
  const subject =
    persisted.subjectKind !== null && persisted.subjectId !== null
      ? { kind: persisted.subjectKind, id: persisted.subjectId }
      : null;

  return parseNote({
    id: persisted.id,
    subject,
    title: persisted.title,
    body: persisted.body,
    createdAt: persisted.createdAt,
    updatedAt: persisted.updatedAt,
  });
}

export { toDomainBookmark, toDomainNote };
