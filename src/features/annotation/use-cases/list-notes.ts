import type { ReadOptions } from "@/shared/read-options";

import type { Note } from "../note";
import type { NoteListScope } from "../note-list-scope";
import type { NoteLister } from "../note-lister";

type ListNotesResult = {
  readonly type: "success";
  readonly notes: readonly Note[];
};

interface ListNotesCapabilities {
  readonly noteLister: NoteLister;
}

async function listNotes(
  scope: NoteListScope,
  { noteLister }: ListNotesCapabilities,
  options?: ReadOptions,
): Promise<ListNotesResult> {
  return { type: "success", notes: await noteLister.getAll(scope, options) };
}

export { listNotes };
export type { ListNotesCapabilities, ListNotesResult };
