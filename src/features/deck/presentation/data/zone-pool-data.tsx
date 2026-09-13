import type { ReactNode } from "react";

import type { CardCounter } from "@/features/card/card-counter";
import type { CardSort } from "@/features/card/card-list-criteria";
import type { CardLister } from "@/features/card/card-lister";
import { CardsData, type CardsDataContent } from "@/features/card/presentation/data/cards-data";
import type { ZoneSection } from "@/features/deck/deck/deck-legality";

import { poolCriteria, type ZonePoolFilters } from "../deck-zone-pool";

function ZonePoolData({
  cardCounter,
  cardLister,
  children,
  filters,
  query,
  sort,
  zone,
}: {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (pool: CardsDataContent) => ReactNode;
  readonly filters: ZonePoolFilters;
  readonly query: string;
  readonly sort: CardSort | undefined;
  readonly zone: ZoneSection;
}) {
  return (
    <CardsData
      cardCounter={cardCounter}
      cardLister={cardLister}
      criteria={poolCriteria(zone, filters, query, sort)}
    >
      {children}
    </CardsData>
  );
}

export { ZonePoolData };
