import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { NoteListScope } from "@/features/annotation/note-list-scope";

/**
 * `bookmarks()` is the subtree every bookmark read hangs under, so one mark reaching several scopes
 * can be invalidated without naming them. `notes()` is the same subtree for notes, and the two are
 * siblings rather than one inside the other: marking a subject writes no note of it, and writing a
 * note on a subject marks nothing.
 */
const annotationKeys = {
  all: () => ["annotation"] as const,
  bookmarks: () => [...annotationKeys.all(), "bookmark"] as const,
  bookmarkList: (scope: BookmarkListScope) =>
    [...annotationKeys.bookmarks(), "list", scope] as const,
  notes: () => [...annotationKeys.all(), "note"] as const,
  noteList: (scope: NoteListScope) => [...annotationKeys.notes(), "list", scope] as const,
  notedSubjects: () => [...annotationKeys.notes(), "subject"] as const,
};

export { annotationKeys };
