import type { ReactNode } from "react";

import type { Card } from "@/features/catalog/card/card";
import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { CardLister } from "@/features/catalog/card/card-lister";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
import { CardsData, type CardsDataContent } from "@/features/catalog/presentation/data/cards-data";

const EVERY_CHAMPION: CardListCriteria = { supertypeIds: ["Champion"] };

function championCriteria(legend: Card | null): CardListCriteria {
  if (legend === null || legend.championName === null) return EVERY_CHAMPION;

  return {
    supertypeIds: ["Champion"],
    championNames: [legend.championName],
    withinDomainIds: [...legend.domainIds],
  };
}

function ChampionPoolData({
  cardCounter,
  cardLister,
  children,
  legend,
}: {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (pool: CardsDataContent) => ReactNode;
  readonly legend: Card | null;
}) {
  return (
    <CardsData
      cardCounter={cardCounter}
      cardLister={cardLister}
      criteria={championCriteria(legend)}
    >
      {children}
    </CardsData>
  );
}

export { championCriteria, ChampionPoolData };
