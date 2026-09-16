import type { NoteId } from "../note";
import type { NoteRemover } from "../note-remover";

type DeleteNoteResult = { readonly type: "success" };

interface DeleteNoteCapabilities {
  readonly noteRemover: NoteRemover;
}

/** Deleting a note that is already gone is a success: the caller's intent is satisfied either way. */
async function deleteNote(
  id: NoteId,
  { noteRemover }: DeleteNoteCapabilities,
): Promise<DeleteNoteResult> {
  await noteRemover.remove(id);

  return { type: "success" };
}

export { deleteNote };
export type { DeleteNoteCapabilities, DeleteNoteResult };
