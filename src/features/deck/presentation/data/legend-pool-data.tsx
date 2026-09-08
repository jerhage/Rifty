import type { ReactNode } from "react";

import type { CardLister } from "@/features/catalog/card/card-lister";
import {
  CardPoolData,
  type CardPoolContent,
} from "@/features/catalog/presentation/data/card-pool-data";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";

import { legendCriteria } from "../deck-zone-pool";

function LegendPoolData({
  cardLister,
  children,
  domainIds,
  query,
}: {
  readonly cardLister: CardLister;
  readonly children: (pool: CardPoolContent) => ReactNode;
  readonly domainIds: readonly CardDomain[];
  readonly query: string;
}) {
  return (
    <CardPoolData cardLister={cardLister} criteria={legendCriteria(query, domainIds)}>
      {children}
    </CardPoolData>
  );
}

export { LegendPoolData };
