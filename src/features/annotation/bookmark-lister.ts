import type { ReadOptions } from "@/shared/read-options";

import type { Bookmark } from "./bookmark";
import type { BookmarkListScope } from "./bookmark-list-scope";

/**
 * Ordered most recently marked first. The scope is honored by the store, so a screen holding
 * hundreds of subjects reads them in one call rather than asking once per row.
 */
interface BookmarkLister {
  getAll(scope: BookmarkListScope, options?: ReadOptions): Promise<readonly Bookmark[]>;
}

export type { BookmarkLister };
