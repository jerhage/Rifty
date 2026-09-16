import type { NoteId } from "./note";

/** A bookmark on the same subject is untouched. */
interface NoteRemover {
  remove(id: NoteId): Promise<void>;
}

export type { NoteRemover };
