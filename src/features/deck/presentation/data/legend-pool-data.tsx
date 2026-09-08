import type { ReactNode } from "react";

import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { CardLister } from "@/features/catalog/card/card-lister";
import { CardsData, type CardsDataContent } from "@/features/catalog/presentation/data/cards-data";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";

import { legendCriteria } from "../deck-zone-pool";

function LegendPoolData({
  cardCounter,
  cardLister,
  children,
  domainIds,
  query,
}: {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (pool: CardsDataContent) => ReactNode;
  readonly domainIds: readonly CardDomain[];
  readonly query: string;
}) {
  return (
    <CardsData
      cardCounter={cardCounter}
      cardLister={cardLister}
      criteria={legendCriteria(query, domainIds)}
    >
      {children}
    </CardsData>
  );
}

export { LegendPoolData };
