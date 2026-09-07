import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import type { CardSummaryLister } from "@/features/catalog/card/card-summary-lister";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardNameSearchScreen } from "@/features/catalog/presentation/card-name-search-screen";
import { CardsData } from "@/features/catalog/presentation/cards-data";

const SEARCH_DEBOUNCE_MS = 300;

function SearchScreen() {
  const { catalog } = useAppDependencies();
  const router = useRouter();
  const [name, setName] = useState("");
  const debouncedName = useDebouncedValue(name, SEARCH_DEBOUNCE_MS);
  const cardSummaryLister = useMemo<CardSummaryLister>(
    () => ({
      getSummaryPage: (criteria, options) =>
        catalog.cards.getSummaryPageByName(debouncedName, criteria, options),
    }),
    [catalog.cards, debouncedName],
  );

  return (
    <CardsData cardSummaryLister={cardSummaryLister}>
      {(content) => (
        <CardNameSearchScreen
          {...content}
          name={name}
          onChangeName={setName}
          onSelectCard={(id) => router.push({ pathname: "/cards/[id]", params: { id } })}
        />
      )}
    </CardsData>
  );
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

export default SearchScreen;
