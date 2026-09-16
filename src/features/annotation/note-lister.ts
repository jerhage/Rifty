import type { ReadOptions } from "@/shared/read-options";

import type { Note } from "./note";
import type { NoteListScope } from "./note-list-scope";

/**
 * Ordered most recently written first, so a subject's newest note leads the list. The scope is
 * honored by the store.
 */
interface NoteLister {
  getAll(scope: NoteListScope, options?: ReadOptions): Promise<readonly Note[]>;
}

export type { NoteLister };
