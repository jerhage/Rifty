import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { NoteListScope } from "@/features/annotation/note-list-scope";

/**
 * Three subtrees, not two: marking a subject writes no note of it and writing a note marks nothing,
 * while `savedSubjects()` spans both, so each write path must leave its own subtree and that one stale.
 */
const annotationKeys = {
  all: () => ["annotation"] as const,
  bookmarks: () => [...annotationKeys.all(), "bookmark"] as const,
  bookmarkList: (scope: BookmarkListScope) =>
    [...annotationKeys.bookmarks(), "list", scope] as const,
  notes: () => [...annotationKeys.all(), "note"] as const,
  noteList: (scope: NoteListScope) => [...annotationKeys.notes(), "list", scope] as const,
  savedSubjects: () => [...annotationKeys.all(), "savedSubject"] as const,
};

export { annotationKeys };
