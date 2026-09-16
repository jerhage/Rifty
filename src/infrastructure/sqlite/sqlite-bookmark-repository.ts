import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { match } from "ts-pattern";

import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { BookmarkRepository } from "@/features/annotation/bookmark-repository";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { bookmarks } from "@/infrastructure/database/annotation-schema/annotations";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";

import { toDomainBookmark } from "./annotation-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteBookmarkRepository implements BookmarkRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get(subject: AnnotationSubject, { signal }: ReadOptions = {}): Promise<Bookmark | null> {
    throwIfAborted(signal);
    const [row] = await this.db.select().from(bookmarks).where(subjectCondition(subject)).limit(1);
    throwIfAborted(signal);

    return row ? toDomainBookmark(row) : null;
  }

  /** Newest mark first, with the subject breaking a tie so two reads agree. */
  async getAll(
    scope: BookmarkListScope,
    { signal }: ReadOptions = {},
  ): Promise<readonly Bookmark[]> {
    throwIfAborted(signal);
    const rows = await this.db
      .select()
      .from(bookmarks)
      .where(scopeCondition(scope))
      .orderBy(desc(bookmarks.createdAt), asc(bookmarks.subjectKind), asc(bookmarks.subjectId));
    throwIfAborted(signal);

    return rows.map(toDomainBookmark);
  }

  /** The subject is the key, so a second mark is a no-op that keeps the first mark's time. */
  async save(bookmark: Bookmark): Promise<void> {
    await this.db
      .insert(bookmarks)
      .values({
        subjectKind: bookmark.subject.kind,
        subjectId: bookmark.subject.id,
        createdAt: bookmark.createdAt,
      })
      .onConflictDoNothing({ target: [bookmarks.subjectKind, bookmarks.subjectId] });
  }

  async remove(subject: AnnotationSubject): Promise<void> {
    await this.db.delete(bookmarks).where(subjectCondition(subject));
  }
}

function subjectCondition(subject: AnnotationSubject): SQL | undefined {
  return and(eq(bookmarks.subjectKind, subject.kind), eq(bookmarks.subjectId, subject.id));
}

function scopeCondition(scope: BookmarkListScope): SQL | undefined {
  return match<BookmarkListScope, SQL | undefined>(scope)
    .with({ type: "all" }, () => undefined)
    .with({ type: "ofKind" }, ({ kind }) => eq(bookmarks.subjectKind, kind))
    .exhaustive();
}

export { SqliteBookmarkRepository };
