import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import {
  RIFTBOUND_STANDARD,
  verifyDeck,
  type ZoneSection,
} from "@/features/deck/deck/deck-legality";

import { minimumForCard } from "../deck-build-allowance";
import type { DeckBuildStart } from "../deck-build-start";
import {
  chooseChampion,
  draftComposition,
  draftFromDeck,
  EMPTY_DRAFT,
  withZoneCard,
  type DeckBuildDraft,
} from "../deck-build-steps";

function useDeckDraft(start: DeckBuildStart) {
  const [draft, setDraft] = useState<DeckBuildDraft>(() => openingDraft(start));

  /** Changing the legend clears the champion, whose tag and domains have to match it. */
  const pickLegend = useCallback((legend: Card) => {
    setDraft((current) =>
      current.legend?.printingId === legend.printingId
        ? { ...current, legend: null }
        : { ...current, legend, chosenChampion: null },
    );
  }, []);

  const pickChampion = useCallback((champion: Card) => {
    setDraft((current) =>
      current.chosenChampion?.printingId === champion.printingId
        ? { ...current, chosenChampion: null }
        : chooseChampion(current, champion),
    );
  }, []);

  const changeName = useCallback((name: string) => {
    setDraft((current) => ({ ...current, name }));
  }, []);

  const setQuantity = useCallback((section: ZoneSection, card: Card, quantity: number) => {
    setDraft((current) =>
      withZoneCard(current, section, card.printingId, {
        card,
        quantity: Math.max(minimumForCard(current, section, card), quantity),
      }),
    );
  }, []);

  const composition = useMemo(() => draftComposition(draft), [draft]);

  const verification = useMemo(() => verifyDeck(composition, RIFTBOUND_STANDARD), [composition]);

  return {
    changeName,
    draft,
    entries: composition.entries,
    pickChampion,
    pickLegend,
    setQuantity,
    verification,
  };
}

function openingDraft(start: DeckBuildStart): DeckBuildDraft {
  return match(start)
    .with({ type: "new" }, () => EMPTY_DRAFT)
    .with({ type: "edit" }, ({ resolvedDeck }) => draftFromDeck(resolvedDeck))
    .exhaustive();
}

export { useDeckDraft };
