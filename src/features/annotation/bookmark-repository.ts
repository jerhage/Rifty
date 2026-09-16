import type { BookmarkFinder } from "./bookmark-finder";
import type { BookmarkLister } from "./bookmark-lister";
import type { BookmarkRemover } from "./bookmark-remover";
import type { BookmarkSaver } from "./bookmark-saver";

interface BookmarkRepository
  extends BookmarkFinder, BookmarkLister, BookmarkRemover, BookmarkSaver {}

export type { BookmarkRepository };
