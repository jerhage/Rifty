import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import { createDeck } from "@/features/deck/deck/use-cases/create-deck";

interface NewDeckCapabilities {
  readonly clock: Clock;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

/** The use case decides whether a name is acceptable; this carries its verdict to the field. */
function useNewDeck(capabilities: NewDeckCapabilities, onCreated: () => void) {
  const [isPresented, setIsPresented] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(() => {
    setName("");
    setError(null);
    setIsPresented(true);
  }, []);
  const dismiss = useCallback(() => setIsPresented(false), []);
  const changeName = useCallback((value: string) => {
    setName(value);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Give the deck a name.");
      return;
    }

    const result = await createDeck(trimmed, capabilities);
    match(result)
      .with({ type: "success" }, () => {
        setIsPresented(false);
        onCreated();
      })
      .with({ type: "nameTaken" }, () => setError("You already have a deck with that name."))
      .with({ type: "saveFailed" }, () => setError("Could not save the deck. Try again."))
      .exhaustive();
  }, [capabilities, name, onCreated]);

  return { changeName, dismiss, error, isPresented, name, open, submit };
}

export { useNewDeck };
export type { NewDeckCapabilities };
