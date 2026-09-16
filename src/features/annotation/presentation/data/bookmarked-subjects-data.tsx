import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, type ReactNode } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import { annotationKeys } from "@/features/annotation/queries/annotation-keys";
import {
  listBookmarksQuery,
  toggleBookmarkMutation,
} from "@/features/annotation/queries/annotation-queries";
import type { AnnotationSubjectKind } from "@/features/annotation/value-objects/annotation-subject";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useReadState } from "@/hooks/use-read-state";
import { useWriteState } from "@/hooks/use-write-state";

const BOOKMARKED_MESSAGE = "Bookmarked.";
const BOOKMARK_REMOVED_MESSAGE = "Bookmark removed.";
const BOOKMARK_FAILED_MESSAGE = "Could not change the bookmark. Try again.";
const EMPTY_IDS: ReadonlySet<string> = new Set();

/** Which subjects of one kind carry a mark, and the one act that puts a mark on or takes it off. */
interface BookmarkedSubjects {
  readonly bookmarkedIds: ReadonlySet<string>;
  toggleBookmark(id: string): void;
}

interface BookmarkedSubjectsDataProps {
  /**
   * The whole set a consumer of marks needs, rather than its four seams one by one: this boundary
   * reads and writes the same rows. Each use case below still takes only the narrow pieces it uses.
   */
  readonly bookmarkManager: BookmarkManager;
  readonly children: (bookmarked: BookmarkedSubjects) => ReactNode;
  readonly clock: Clock;
  readonly kind: AnnotationSubjectKind;
}

/**
 * Every mark of one kind in one read, as the set of the ids that carry one. A screen holding a
 * thousand subjects asks this once and answers each of them from the set, rather than asking the
 * store once per row.
 *
 * It owns the write as well, because the answer it hands down is what the write changes. There is
 * no in-flight appearance: the control shows what is stored, a mark lands when the read comes back,
 * and the two outcomes and the failure are what a reader who cannot see the control is told.
 */
function BookmarkedSubjectsData({
  bookmarkManager,
  children,
  clock,
  kind,
}: BookmarkedSubjectsDataProps) {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();
  const scope = useMemo<BookmarkListScope>(() => ({ type: "ofKind", kind }), [kind]);
  const { reload, state } = useReadState(
    listBookmarksQuery(scope, { bookmarkLister: bookmarkManager }),
  );

  const { submit } = useWriteState({
    ...toggleBookmarkMutation({
      bookmarkFinder: bookmarkManager,
      bookmarkRemover: bookmarkManager,
      bookmarkSaver: bookmarkManager,
      clock,
    }),
    onError: () => announce(BOOKMARK_FAILED_MESSAGE, "interrupting"),
    /**
     * One mark is read through several scopes — this kind, every kind, and the subject on its own —
     * so the whole bookmark subtree goes stale rather than the scope the press happened to come
     * from. Notes are left alone: marking a subject writes no note of it.
     */
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: annotationKeys.bookmarks() });
      announce(
        match(result)
          .with({ type: "bookmarked" }, () => BOOKMARKED_MESSAGE)
          .with({ type: "removed" }, () => BOOKMARK_REMOVED_MESSAGE)
          .exhaustive(),
      );
    },
  });

  const bookmarkedIds = useMemo(
    () =>
      match(state)
        .with(
          { type: "success" },
          ({ bookmarks }) => new Set(bookmarks.map(({ subject }) => subject.id)),
        )
        .with({ type: "loading" }, { type: "failed" }, () => EMPTY_IDS)
        .exhaustive(),
    [state],
  );

  const toggleBookmark = useCallback((id: string) => submit({ kind, id }), [kind, submit]);

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your bookmarks."
      />
    ))
    .with({ type: "success" }, () => children({ bookmarkedIds, toggleBookmark }))
    .exhaustive();
}

export { BookmarkedSubjectsData };
export type { BookmarkedSubjects, BookmarkedSubjectsDataProps };
