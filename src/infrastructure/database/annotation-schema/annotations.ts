import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { check, index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

const annotationSubjectKindSchema = z.enum(["coreRule", "card", "deck"]);

/**
 * A person's mark on one subject, generic over what that subject is. The subject is the key: one
 * subject carries one mark or none, so a surrogate id beside it would state the same fact twice.
 *
 * `subject_id` carries no foreign key deliberately: a core rule is replaced wholesale when the
 * rules edition changes, so a restricting key would block the reseed the first time a bookmarked
 * rule was renumbered, and a cascading key would silently delete the mark instead. The app detects
 * a subject that no longer resolves rather than pretending the mark is intact.
 */
const bookmarks = sqliteTable(
  "bookmark",
  {
    subjectKind: text("subject_kind").notNull(),
    subjectId: text("subject_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.subjectKind, table.subjectId] })],
);

/**
 * A person's written note. A subject may collect several, and a note may stand alone, so the
 * subject pair is nullable and carries no foreign key either, for the reason above.
 */
const notes = sqliteTable(
  "note",
  {
    id: text().primaryKey(),
    subjectKind: text("subject_kind"),
    subjectId: text("subject_id"),
    title: text().notNull().default(""),
    body: text().notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    check(
      "note_subject_pair_complete",
      sql`(${table.subjectKind} is null) = (${table.subjectId} is null)`,
    ),
    index("note_subject").on(table.subjectKind, table.subjectId),
  ],
);

const bookmarkSelectSchema = createSelectSchema(bookmarks, {
  subjectKind: annotationSubjectKindSchema,
});
const bookmarkInsertSchema = createInsertSchema(bookmarks, {
  subjectKind: annotationSubjectKindSchema,
  subjectId: (schema) => schema.trim().min(1),
  createdAt: (schema) => schema.trim().min(1),
});

/** The subject refinements take the callback form so that drizzle keeps the columns nullable. */
const noteSelectSchema = createSelectSchema(notes, {
  subjectKind: () => annotationSubjectKindSchema,
});
const noteInsertSchema = createInsertSchema(notes, {
  id: (schema) => schema.trim().min(1),
  subjectKind: () => annotationSubjectKindSchema,
  subjectId: (schema) => schema.trim().min(1),
  title: (schema) => schema,
  body: (schema) => schema,
  createdAt: (schema) => schema.trim().min(1),
  updatedAt: (schema) => schema.trim().min(1),
});

export {
  annotationSubjectKindSchema,
  bookmarkInsertSchema,
  bookmarkSelectSchema,
  bookmarks,
  noteInsertSchema,
  noteSelectSchema,
  notes,
};
