import type { ReactNode } from "react";

import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import { CardsData, type CardsDataContent } from "@/features/catalog/presentation/data/cards-data";
import type { DeckSection } from "@/features/deck/deck/deck";

import { poolCriteria, type ZonePoolFilters } from "../deck-zone-pool";

function ZonePoolData({
  cardCounter,
  cardLister,
  children,
  filters,
  query,
  zone,
}: {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (pool: CardsDataContent) => ReactNode;
  readonly filters: ZonePoolFilters;
  readonly query: string;
  readonly zone: DeckSection;
}) {
  return (
    <CardsData
      cardCounter={cardCounter}
      cardLister={cardLister}
      criteria={poolCriteria(zone, filters, query)}
    >
      {children}
    </CardsData>
  );
}

export { ZonePoolData };
