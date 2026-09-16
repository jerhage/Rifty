import type { Bookmark } from "./bookmark";

/** Marking a subject that already carries a mark leaves the first mark's time standing. */
interface BookmarkSaver {
  save(bookmark: Bookmark): Promise<void>;
}

export type { BookmarkSaver };
