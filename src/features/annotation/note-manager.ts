import type { NoteFinder } from "./note-finder";
import type { NoteLister } from "./note-lister";
import type { NoteRemover } from "./note-remover";
import type { NoteSaver } from "./note-saver";

/**
 * What a consumer that manages a subject's notes asks for: read one, read a scope of them, write
 * one, take one away. `NoteRepository` composes the same four today and is not the same thing —
 * that one is what the store implements and grows as persistence grows, while this one stays the
 * set a screen needs. Being identical at a moment is not either of them being redundant.
 */
interface NoteManager extends NoteFinder, NoteLister, NoteRemover, NoteSaver {}

export type { NoteManager };
