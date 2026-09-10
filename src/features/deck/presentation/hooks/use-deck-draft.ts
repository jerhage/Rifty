import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";

import { minimumForCard } from "../deck-build-allowance";
import type { DeckBuildStart } from "../deck-build-start";
import {
  chooseChampion,
  draftEntries,
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

  const setQuantity = useCallback((section: DeckSection, card: Card, quantity: number) => {
    setDraft((current) =>
      withZoneCard(current, section, card.printingId, {
        card,
        quantity: Math.max(minimumForCard(current, section, card), quantity),
      }),
    );
  }, []);

  const entries = useMemo(() => draftEntries(draft), [draft]);

  /** Judged against a stand-in deck: the draft is not saved yet, so it has no identity. */
  const verification = useMemo(
    () =>
      verifyDeck(
        {
          id: "draft",
          name: draft.name || "Draft",
          notes: "",
          createdAt: "1970-01-01T00:00:00.000Z",
          updatedAt: "1970-01-01T00:00:00.000Z",
          chosenChampionCardId: draft.chosenChampion?.cardId ?? null,
          entries,
        },
        RIFTBOUND_STANDARD,
      ),
    [draft.chosenChampion, draft.name, entries],
  );

  return { changeName, draft, entries, pickChampion, pickLegend, setQuantity, verification };
}

function openingDraft(start: DeckBuildStart): DeckBuildDraft {
  return match(start)
    .with({ type: "new" }, () => EMPTY_DRAFT)
    .with({ type: "edit" }, ({ cards, deck }) => draftFromDeck(deck, cards))
    .exhaustive();
}

export { useDeckDraft };
