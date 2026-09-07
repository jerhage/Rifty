import type { DeckId } from "../deck";
import type { DeckRemover } from "../deck-remover";

type DeleteDeckResult = { readonly type: "success" } | { readonly type: "deleteFailed" };

interface DeleteDeckCapabilities {
  readonly deckRemover: DeckRemover;
}

/** Deleting a deck that is already gone is a success: the caller's intent is satisfied either way. */
async function deleteDeck(
  id: DeckId,
  { deckRemover }: DeleteDeckCapabilities,
): Promise<DeleteDeckResult> {
  try {
    await deckRemover.remove(id);
    return { type: "success" };
  } catch {
    return { type: "deleteFailed" };
  }
}

export { deleteDeck };
export type { DeleteDeckCapabilities, DeleteDeckResult };
