import type { Note } from "./note";

/** Replaces the note stored under this identifier. When it was first written does not change. */
interface NoteSaver {
  save(note: Note): Promise<void>;
}

export type { NoteSaver };
