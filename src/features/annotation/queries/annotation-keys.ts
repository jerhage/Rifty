import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";

/**
 * `bookmarks()` is the subtree every bookmark read hangs under, so one mark reaching several scopes
 * can be invalidated without naming them. Notes sit beside it and are untouched by a mark.
 */
const annotationKeys = {
  all: () => ["annotation"] as const,
  bookmarks: () => [...annotationKeys.all(), "bookmark"] as const,
  bookmarkList: (scope: BookmarkListScope) =>
    [...annotationKeys.bookmarks(), "list", scope] as const,
};

export { annotationKeys };
