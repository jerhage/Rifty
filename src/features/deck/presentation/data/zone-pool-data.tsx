import type { ReactNode } from "react";

import type { CardLister } from "@/features/catalog/card/card-lister";
import { CardsData, type CardsDataContent } from "@/features/catalog/presentation/data/cards-data";
import type { DeckSection } from "@/features/deck/deck/deck";

import { poolCriteria, type ZonePoolFilters } from "../deck-zone-pool";

function ZonePoolData({
  cardLister,
  children,
  filters,
  zone,
}: {
  readonly cardLister: CardLister;
  readonly children: (pool: CardsDataContent) => ReactNode;
  readonly filters: ZonePoolFilters;
  readonly zone: DeckSection;
}) {
  return (
    <CardsData cardLister={cardLister} criteria={poolCriteria(zone, filters)}>
      {children}
    </CardsData>
  );
}

export { ZonePoolData };
