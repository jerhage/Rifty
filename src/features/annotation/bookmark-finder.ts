import type { ReadOptions } from "@/shared/read-options";

import type { Bookmark } from "./bookmark";
import type { AnnotationSubject } from "./value-objects/annotation-subject";

/** Answers whether one subject carries a mark, and when it was made. */
interface BookmarkFinder {
  get(subject: AnnotationSubject, options?: ReadOptions): Promise<Bookmark | null>;
}

export type { BookmarkFinder };
