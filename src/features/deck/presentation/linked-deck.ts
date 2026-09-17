import { deckIdSchema, type DeckId } from "@/features/deck/deck/deck";

type LinkedDeck =
  | { readonly type: "savedDeck"; readonly deckId: DeckId }
  | { readonly type: "unknownDeck" };

function linkedDeck(parameter: string): LinkedDeck {
  const parsed = deckIdSchema.safeParse(parameter);

  return parsed.success ? { type: "savedDeck", deckId: parsed.data } : { type: "unknownDeck" };
}

export { linkedDeck };
export type { LinkedDeck };
