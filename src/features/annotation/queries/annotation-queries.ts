import { mutationOptions, queryOptions } from "@tanstack/react-query";

import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { NoteId } from "@/features/annotation/note";
import type { NoteListScope } from "@/features/annotation/note-list-scope";
import {
  deleteNote,
  type DeleteNoteCapabilities,
} from "@/features/annotation/use-cases/delete-note";
import {
  listBookmarks,
  type ListBookmarksCapabilities,
} from "@/features/annotation/use-cases/list-bookmarks";
import { listNotes, type ListNotesCapabilities } from "@/features/annotation/use-cases/list-notes";
import {
  toggleBookmark,
  type ToggleBookmarkCapabilities,
} from "@/features/annotation/use-cases/toggle-bookmark";
import {
  writeNote,
  type NoteDraft,
  type WriteNoteCapabilities,
} from "@/features/annotation/use-cases/write-note";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";

import { annotationKeys } from "./annotation-keys";

/**
 * These rows are the person's own and change while the app is open, so they get none of the hour a
 * seeded reference document is worth. Zero rather than a few minutes: a bookmark is one indexed row
 * of a local database, so a reread costs nothing worth holding a stale answer for, and several
 * screens write these rows — a mounting screen is then correct on what another screen has just
 * marked without every writer having to know every reader's key.
 */
const ANNOTATION_STALE_TIME_MS = 0;

function listBookmarksQuery(scope: BookmarkListScope, capabilities: ListBookmarksCapabilities) {
  return queryOptions({
    queryKey: annotationKeys.bookmarkList(scope),
    queryFn: ({ signal }) => listBookmarks(scope, capabilities, { signal }),
    staleTime: ANNOTATION_STALE_TIME_MS,
  });
}

function toggleBookmarkMutation(capabilities: ToggleBookmarkCapabilities) {
  return mutationOptions({
    mutationFn: (subject: AnnotationSubject) => toggleBookmark(subject, capabilities),
  });
}

function listNotesQuery(scope: NoteListScope, capabilities: ListNotesCapabilities) {
  return queryOptions({
    queryKey: annotationKeys.noteList(scope),
    queryFn: ({ signal }) => listNotes(scope, capabilities, { signal }),
    staleTime: ANNOTATION_STALE_TIME_MS,
  });
}

function writeNoteMutation(capabilities: WriteNoteCapabilities) {
  return mutationOptions({
    mutationFn: (draft: NoteDraft) => writeNote(draft, capabilities),
  });
}

function deleteNoteMutation(capabilities: DeleteNoteCapabilities) {
  return mutationOptions({
    mutationFn: (id: NoteId) => deleteNote(id, capabilities),
  });
}

export {
  deleteNoteMutation,
  listBookmarksQuery,
  listNotesQuery,
  toggleBookmarkMutation,
  writeNoteMutation,
};
