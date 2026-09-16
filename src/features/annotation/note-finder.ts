import type { ReadOptions } from "@/shared/read-options";

import type { Note, NoteId } from "./note";

interface NoteFinder {
  get(id: NoteId, options?: ReadOptions): Promise<Note | null>;
}

export type { NoteFinder };
