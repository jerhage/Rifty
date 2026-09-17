import type { ReactNode } from "react";
import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import { CardsData, type CardsDataContent } from "@/features/card/presentation/data/cards-data";
import { CHAMPION_UNIT } from "@/features/deck/deck/deck-legality";

import type { DeckBuildPick } from "../deck-build-steps";

const EVERY_CHAMPION: CardListCriteria = {
  typeIds: [CHAMPION_UNIT.typeId],
  supertypeIds: [CHAMPION_UNIT.supertypeId],
};

function championCriteria(legend: DeckBuildPick): CardListCriteria {
  return match(legend)
    .with({ type: "notPicked" }, () => EVERY_CHAMPION)
    .with({ type: "picked" }, ({ card }) => championsTheLegendAllows(card))
    .exhaustive();
}

function championsTheLegendAllows(legend: Card): CardListCriteria {
  if (legend.championName === null) return EVERY_CHAMPION;

  return {
    ...EVERY_CHAMPION,
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
  readonly legend: DeckBuildPick;
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
