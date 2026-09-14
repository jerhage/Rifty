import type { ReactNode } from "react";

import type { CardCounter } from "@/features/card/card-counter";
import type { CardSort } from "@/features/card/card-list-criteria";
import type { CardLister } from "@/features/card/card-lister";
import { CardsData, type CardsDataContent } from "@/features/card/presentation/data/cards-data";
import type { DeckSection } from "@/features/deck/deck/deck";

import { poolCriteria, type SectionPoolFilters } from "../deck-section-pool";

function SectionPoolData({
  cardCounter,
  cardLister,
  children,
  filters,
  query,
  sort,
  section,
}: {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (pool: CardsDataContent) => ReactNode;
  readonly filters: SectionPoolFilters;
  readonly query: string;
  readonly sort: CardSort | undefined;
  readonly section: DeckSection;
}) {
  return (
    <CardsData
      cardCounter={cardCounter}
      cardLister={cardLister}
      criteria={poolCriteria(section, filters, query, sort)}
    >
      {children}
    </CardsData>
  );
}

export { SectionPoolData };
