import type { ReadOptions } from "@/shared/read-options";

import type { Bookmark } from "../bookmark";
import type { BookmarkListScope } from "../bookmark-list-scope";
import type { BookmarkLister } from "../bookmark-lister";

type ListBookmarksResult = {
  readonly type: "success";
  readonly bookmarks: readonly Bookmark[];
};

interface ListBookmarksCapabilities {
  readonly bookmarkLister: BookmarkLister;
}

/** Marking nothing is a legitimate answer, so an empty list is a success rather than a variant. */
async function listBookmarks(
  scope: BookmarkListScope,
  { bookmarkLister }: ListBookmarksCapabilities,
  options?: ReadOptions,
): Promise<ListBookmarksResult> {
  return { type: "success", bookmarks: await bookmarkLister.getAll(scope, options) };
}

export { listBookmarks };
export type { ListBookmarksCapabilities, ListBookmarksResult };
