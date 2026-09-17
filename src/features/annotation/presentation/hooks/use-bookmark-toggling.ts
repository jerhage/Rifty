import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { BookmarkFinder } from "@/features/annotation/bookmark-finder";
import type { BookmarkRemover } from "@/features/annotation/bookmark-remover";
import type { BookmarkSaver } from "@/features/annotation/bookmark-saver";
import { annotationKeys } from "@/features/annotation/queries/annotation-keys";
import { toggleBookmarkMutation } from "@/features/annotation/queries/annotation-queries";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useWriteState } from "@/hooks/use-write-state";

const BOOKMARKED_MESSAGE = "Bookmarked.";
const BOOKMARK_REMOVED_MESSAGE = "Bookmark removed.";
const BOOKMARK_FAILED_MESSAGE = "Could not change the bookmark. Try again.";

interface BookmarkToggling {
  toggleBookmark(subject: AnnotationSubject): void;
}

interface BookmarkTogglingDependencies {
  readonly bookmarkFinder: BookmarkFinder;
  readonly bookmarkRemover: BookmarkRemover;
  readonly bookmarkSaver: BookmarkSaver;
  readonly clock: Clock;
  readonly onBookmarksChanged?: (() => void) | undefined;
}

function useBookmarkToggling({
  bookmarkFinder,
  bookmarkRemover,
  bookmarkSaver,
  clock,
  onBookmarksChanged,
}: BookmarkTogglingDependencies): BookmarkToggling {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();

  const refreshBookmarksAndSavedSubjects = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: annotationKeys.bookmarks() });
    void queryClient.invalidateQueries({ queryKey: annotationKeys.savedSubjects() });
  }, [queryClient]);

  const { submit } = useWriteState({
    ...toggleBookmarkMutation({ bookmarkFinder, bookmarkRemover, bookmarkSaver, clock }),
    onError: () => announce(BOOKMARK_FAILED_MESSAGE, "interrupting"),
    onSuccess: (result) => {
      refreshBookmarksAndSavedSubjects();
      onBookmarksChanged?.();
      announce(
        match(result)
          .with({ type: "bookmarked" }, () => BOOKMARKED_MESSAGE)
          .with({ type: "removed" }, () => BOOKMARK_REMOVED_MESSAGE)
          .exhaustive(),
      );
    },
  });

  return { toggleBookmark: submit };
}

export { useBookmarkToggling };
export type { BookmarkToggling, BookmarkTogglingDependencies };
