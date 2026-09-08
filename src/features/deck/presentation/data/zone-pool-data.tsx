import type { ReactNode } from "react";

import type { CardLister } from "@/features/catalog/card/card-lister";
import {
  CardPoolData,
  type CardPoolContent,
} from "@/features/catalog/presentation/data/card-pool-data";
import type { DeckSection } from "@/features/deck/deck/deck";

import { poolCriteria, type ZonePoolFilters } from "../deck-zone-pool";

function ZonePoolData({
  cardLister,
  children,
  filters,
  zone,
}: {
  readonly cardLister: CardLister;
  readonly children: (pool: CardPoolContent) => ReactNode;
  readonly filters: ZonePoolFilters;
  readonly zone: DeckSection;
}) {
  return (
    <CardPoolData cardLister={cardLister} criteria={poolCriteria(zone, filters)}>
      {children}
    </CardPoolData>
  );
}

export { ZonePoolData };
