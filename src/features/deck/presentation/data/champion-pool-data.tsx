import type { ReactNode } from "react";

import type { Card } from "@/features/catalog/card/card";
import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { CardLister } from "@/features/catalog/card/card-lister";
import { CardsData, type CardsDataContent } from "@/features/catalog/presentation/data/cards-data";

import { eligibleChampions } from "../champion-eligibility";

/**
 * Eligibility is settled here rather than in the query because the catalog does not record which
 * legend a champion answers to. See the TODO about storing that tag.
 */
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
      criteria={{ supertypeIds: ["Champion"] }}
    >
      {(pool) => children({ ...pool, cards: eligibleChampions(pool.cards, legend) })}
    </CardsData>
  );
}

export { ChampionPoolData };
