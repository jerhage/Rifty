import type { NoteFinder } from "./note-finder";
import type { NoteLister } from "./note-lister";
import type { NoteRemover } from "./note-remover";
import type { NoteSaver } from "./note-saver";

interface NoteRepository extends NoteFinder, NoteLister, NoteRemover, NoteSaver {}

export type { NoteRepository };
