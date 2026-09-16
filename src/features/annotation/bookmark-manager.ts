import type { BookmarkFinder } from "./bookmark-finder";
import type { BookmarkLister } from "./bookmark-lister";
import type { BookmarkRemover } from "./bookmark-remover";
import type { BookmarkSaver } from "./bookmark-saver";

/**
 * What a consumer that manages marks asks for: read one, read a scope of them, put a mark on, take
 * it off. `BookmarkRepository` composes the same four today and is not the same thing — that one is
 * what the store implements and grows as persistence grows, while this one stays the set a screen
 * needs. Being identical at a moment is not either of them being redundant.
 */
interface BookmarkManager extends BookmarkFinder, BookmarkLister, BookmarkRemover, BookmarkSaver {}

export type { BookmarkManager };
