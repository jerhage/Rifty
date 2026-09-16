import type { Clock } from "@/application/ports/clock";

import { parseBookmark, type Bookmark } from "../bookmark";
import type { BookmarkFinder } from "../bookmark-finder";
import type { BookmarkRemover } from "../bookmark-remover";
import type { BookmarkSaver } from "../bookmark-saver";
import type { AnnotationSubject } from "../value-objects/annotation-subject";

type ToggleBookmarkResult =
  | { readonly type: "bookmarked"; readonly bookmark: Bookmark }
  | { readonly type: "removed" };

interface ToggleBookmarkCapabilities {
  readonly bookmarkFinder: BookmarkFinder;
  readonly bookmarkRemover: BookmarkRemover;
  readonly bookmarkSaver: BookmarkSaver;
  readonly clock: Clock;
}

/**
 * One call for the whole act, and the result says which way it went. A screen must not read the
 * state and then decide, because the decision would be made against a value it no longer holds.
 */
async function toggleBookmark(
  subject: AnnotationSubject,
  { bookmarkFinder, bookmarkRemover, bookmarkSaver, clock }: ToggleBookmarkCapabilities,
): Promise<ToggleBookmarkResult> {
  if (await bookmarkFinder.get(subject)) {
    await bookmarkRemover.remove(subject);
    return { type: "removed" };
  }

  const bookmark = parseBookmark({ subject, createdAt: clock.now() });
  await bookmarkSaver.save(bookmark);

  return { type: "bookmarked", bookmark };
}

export { toggleBookmark };
export type { ToggleBookmarkCapabilities, ToggleBookmarkResult };
