import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";

import { minimumForCard } from "../deck-build-allowance";
import type { DeckBuildMode } from "../deck-build-mode";
import {
  chooseChampion,
  draftComposition,
  draftFromDeck,
  EMPTY_DRAFT,
  isPickOf,
  NOT_PICKED,
  pickOf,
  withSectionCard,
  type DeckBuildDraft,
} from "../deck-build-steps";

function useDeckDraft(mode: DeckBuildMode) {
  const [draft, setDraft] = useState<DeckBuildDraft>(() => openingDraft(mode));

  /** Changing the legend clears the champion, whose tag and domains have to match it. */
  const pickLegend = useCallback((legend: Card) => {
    setDraft((current) =>
      isPickOf(current.legend, legend)
        ? { ...current, legend: NOT_PICKED }
        : { ...current, legend: pickOf(legend), chosenChampion: NOT_PICKED },
    );
  }, []);

  const pickChampion = useCallback((champion: Card) => {
    setDraft((current) =>
      isPickOf(current.chosenChampion, champion)
        ? { ...current, chosenChampion: NOT_PICKED }
        : chooseChampion(current, champion),
    );
  }, []);

  const changeName = useCallback((name: string) => {
    setDraft((current) => ({ ...current, name }));
  }, []);

  const setQuantity = useCallback((section: DeckSection, card: Card, quantity: number) => {
    setDraft((current) =>
      withSectionCard(current, section, card.printingId, {
        card,
        quantity: Math.max(minimumForCard(current, section, card), quantity),
      }),
    );
  }, []);

  const composition = useMemo(() => draftComposition(draft), [draft]);

  const verification = useMemo(() => verifyDeck(composition, RIFTBOUND_STANDARD), [composition]);

  return {
    changeName,
    chosenChampion: composition.chosenChampion,
    draft,
    entries: composition.entries,
    pickChampion,
    pickLegend,
    setQuantity,
    verification,
  };
}

function openingDraft(mode: DeckBuildMode): DeckBuildDraft {
  return match(mode)
    .with({ type: "create" }, () => EMPTY_DRAFT)
    .with({ type: "edit" }, ({ resolvedDeck }) => draftFromDeck(resolvedDeck))
    .exhaustive();
}

export { useDeckDraft };
