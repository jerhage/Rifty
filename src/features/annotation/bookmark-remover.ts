import type { AnnotationSubject } from "./value-objects/annotation-subject";

/** Notes on the same subject are untouched: marking and annotating are two separate acts. */
interface BookmarkRemover {
  remove(subject: AnnotationSubject): Promise<void>;
}

export type { BookmarkRemover };
