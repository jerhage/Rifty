import type { ReadOptions } from "@/shared/read-options";

import type { Bookmark } from "../bookmark";
import type { BookmarkFinder } from "../bookmark-finder";
import type { AnnotationSubject } from "../value-objects/annotation-subject";

/** The variants answer the question asked — is this marked? — rather than whether a row was found. */
type FindBookmarkResult =
  | { readonly type: "bookmarked"; readonly bookmark: Bookmark }
  | { readonly type: "notBookmarked" };

interface FindBookmarkCapabilities {
  readonly bookmarkFinder: BookmarkFinder;
}

async function findBookmark(
  subject: AnnotationSubject,
  { bookmarkFinder }: FindBookmarkCapabilities,
  options?: ReadOptions,
): Promise<FindBookmarkResult> {
  const bookmark = await bookmarkFinder.get(subject, options);

  return bookmark ? { type: "bookmarked", bookmark } : { type: "notBookmarked" };
}

export { findBookmark };
export type { FindBookmarkCapabilities, FindBookmarkResult };
