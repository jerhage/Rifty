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
import {
  annotationSubjectSchema,
  type AnnotationSubjectId,
  type AnnotationSubjectKind,
} from "@/features/annotation/value-objects/annotation-subject";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useReadState } from "@/hooks/use-read-state";
import { useWriteState } from "@/hooks/use-write-state";

const BOOKMARKED_MESSAGE = "Bookmarked.";
const BOOKMARK_REMOVED_MESSAGE = "Bookmark removed.";
const BOOKMARK_FAILED_MESSAGE = "Could not change the bookmark. Try again.";
const EMPTY_IDS: ReadonlySet<string> = new Set();

/**
 * Which subjects of one kind carry a mark, and the one act that puts a mark on or takes it off.
 * The kind fixes the identifier, so a rule number cannot be handed to a screen of cards.
 */
interface BookmarkedSubjects<TKind extends AnnotationSubjectKind> {
  readonly bookmarkedCount: number;
  isBookmarked(id: AnnotationSubjectId<TKind>): boolean;
  toggleBookmark(id: AnnotationSubjectId<TKind>): void;
}

interface BookmarkedSubjectsDataProps<TKind extends AnnotationSubjectKind> {
  /** The whole set, because this boundary reads and writes the same rows. */
  readonly bookmarkManager: BookmarkManager;
  readonly children: (bookmarked: BookmarkedSubjects<TKind>) => ReactNode;
  readonly clock: Clock;
  readonly kind: TKind;
  readonly onBookmarksChanged?: () => void;
}

/**
 * Every mark of one kind in one read, so a screen holding a thousand subjects asks once rather than
 * once per row. There is no in-flight appearance: the control shows what is stored.
 */
function BookmarkedSubjectsData<TKind extends AnnotationSubjectKind>({
  bookmarkManager,
  children,
  clock,
  kind,
  onBookmarksChanged,
}: BookmarkedSubjectsDataProps<TKind>) {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();
  const scope = useMemo<BookmarkListScope>(() => ({ type: "ofKind", kind }), [kind]);
  const { reload, state } = useReadState(
    listBookmarksQuery(scope, { bookmarkLister: bookmarkManager }),
  );

  const refreshBookmarksAndNotedSubjects = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: annotationKeys.bookmarks() });
    void queryClient.invalidateQueries({ queryKey: annotationKeys.notedSubjects() });
  }, [queryClient]);

  const { submit } = useWriteState({
    ...toggleBookmarkMutation({
      bookmarkFinder: bookmarkManager,
      bookmarkRemover: bookmarkManager,
      bookmarkSaver: bookmarkManager,
      clock,
    }),
    onError: () => announce(BOOKMARK_FAILED_MESSAGE, "interrupting"),
    onSuccess: (result) => {
      refreshBookmarksAndNotedSubjects();
      onBookmarksChanged?.();
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
          ({ bookmarks }): ReadonlySet<string> =>
            new Set(bookmarks.map(({ subject }) => subject.id)),
        )
        .with({ type: "loading" }, { type: "failed" }, () => EMPTY_IDS)
        .exhaustive(),
    [state],
  );

  const isBookmarked = useCallback(
    (id: AnnotationSubjectId<TKind>) => bookmarkedIds.has(id),
    [bookmarkedIds],
  );

  /** The kind and the id are assembled into a subject here, so the write cannot name another kind. */
  const toggleBookmark = useCallback(
    (id: AnnotationSubjectId<TKind>) => submit(annotationSubjectSchema.parse({ kind, id })),
    [kind, submit],
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your bookmarks."
      />
    ))
    .with({ type: "success" }, () =>
      children({ bookmarkedCount: bookmarkedIds.size, isBookmarked, toggleBookmark }),
    )
    .exhaustive();
}

export { BookmarkedSubjectsData };
export type { BookmarkedSubjects, BookmarkedSubjectsDataProps };
