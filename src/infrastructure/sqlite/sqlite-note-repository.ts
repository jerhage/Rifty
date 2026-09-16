import { and, asc, desc, eq, isNull, type SQL } from "drizzle-orm";
import { match } from "ts-pattern";

import type { Note, NoteId } from "@/features/annotation/note";
import type { NoteListScope } from "@/features/annotation/note-list-scope";
import type { NoteRepository } from "@/features/annotation/note-repository";
import { notes } from "@/infrastructure/database/annotation-schema/annotations";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";

import { toDomainNote } from "./annotation-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteNoteRepository implements NoteRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get(id: NoteId, { signal }: ReadOptions = {}): Promise<Note | null> {
    throwIfAborted(signal);
    const [row] = await this.db.select().from(notes).where(eq(notes.id, id)).limit(1);
    throwIfAborted(signal);

    return row ? toDomainNote(row) : null;
  }

  /** Newest writing first, with the id breaking a tie so two reads agree. */
  async getAll(scope: NoteListScope, { signal }: ReadOptions = {}): Promise<readonly Note[]> {
    throwIfAborted(signal);
    const rows = await this.db
      .select()
      .from(notes)
      .where(scopeCondition(scope))
      .orderBy(desc(notes.updatedAt), asc(notes.id));
    throwIfAborted(signal);

    return rows.map(toDomainNote);
  }

  /** `created_at` is left out of the update: when a note was first written cannot be rewritten. */
  async save(note: Note): Promise<void> {
    const subjectKind = note.subject?.kind ?? null;
    const subjectId = note.subject?.id ?? null;

    await this.db
      .insert(notes)
      .values({
        id: note.id,
        subjectKind,
        subjectId,
        title: note.title,
        body: note.body,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })
      .onConflictDoUpdate({
        target: notes.id,
        set: {
          subjectKind,
          subjectId,
          title: note.title,
          body: note.body,
          updatedAt: note.updatedAt,
        },
      });
  }

  async remove(id: NoteId): Promise<void> {
    await this.db.delete(notes).where(eq(notes.id, id));
  }
}

function scopeCondition(scope: NoteListScope): SQL | undefined {
  return match<NoteListScope, SQL | undefined>(scope)
    .with({ type: "all" }, () => undefined)
    .with({ type: "standalone" }, () => isNull(notes.subjectKind))
    .with({ type: "onSubject" }, ({ subject }) =>
      and(eq(notes.subjectKind, subject.kind), eq(notes.subjectId, subject.id)),
    )
    .exhaustive();
}

export { SqliteNoteRepository };
