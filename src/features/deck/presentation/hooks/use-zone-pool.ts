import { useCallback, useState } from "react";

import type { Card } from "@/features/card/card";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDraftSheet } from "@/hooks/use-draft-sheet";
import { toggle } from "@/shared/toggle";

import {
  defaultPoolFilters,
  type ZonePoolFilters,
  type ZonePoolLayout,
  type ZonePoolView,
} from "../deck-zone-pool";

const SEARCH_DEBOUNCE_MS = 300;

function useZonePool(legend: Card | null) {
  const [zone, setZone] = useState<DeckSection>("mainDeck");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<ZonePoolLayout>("list");
  const [view, setView] = useState<ZonePoolView>("pool");
  const sheet = useDraftSheet<ZonePoolFilters>(() => defaultPoolFilters(legend));
  const { editDraft, settle } = sheet;

  /** The field updates on every keystroke; `searchQuery` waits for a pause in typing. */
  const searchQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const toggleDomain = useCallback(
    (domainId: CardDomain) => {
      editDraft((current) => ({ ...current, domainIds: toggle(current.domainIds, domainId) }));
    },
    [editDraft],
  );

  const toggleKeyword = useCallback(
    (keywordId: string) => {
      editDraft((current) => ({ ...current, keywordIds: toggle(current.keywordIds, keywordId) }));
    },
    [editDraft],
  );

  const toggleType = useCallback(
    (typeId: CardType) => {
      editDraft((current) => ({ ...current, typeIds: toggle(current.typeIds, typeId) }));
    },
    [editDraft],
  );

  const resetFilters = useCallback(() => {
    editDraft(() => defaultPoolFilters(legend));
  }, [editDraft, legend]);

  const resetFor = useCallback(
    (subject: Card | null) => {
      settle(defaultPoolFilters(subject));
      setQuery("");
    },
    [settle],
  );

  return {
    applyFilters: sheet.apply,
    dismissFilters: sheet.dismiss,
    draftFilters: sheet.draft,
    filters: sheet.applied,
    isFilterOpen: sheet.isOpen,
    layout,
    openFilters: sheet.open,
    query,
    resetFilters,
    resetFor,
    searchQuery,
    setLayout,
    setQuery,
    setView,
    setZone,
    toggleDomain,
    toggleKeyword,
    toggleType,
    view,
    zone,
  };
}

export { useZonePool };
