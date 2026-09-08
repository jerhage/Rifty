import type { ReactNode } from "react";

import type { Card } from "@/features/catalog/card/card";
import type { CardLister } from "@/features/catalog/card/card-lister";
import {
  CardPoolData,
  type CardPoolContent,
} from "@/features/catalog/presentation/data/card-pool-data";

import { eligibleChampions } from "../champion-eligibility";

/**
 * Eligibility is settled here rather than in the query because the catalog does not record which
 * legend a champion answers to. See the TODO about storing that tag.
 */
function ChampionPoolData({
  cardLister,
  children,
  legend,
}: {
  readonly cardLister: CardLister;
  readonly children: (pool: CardPoolContent) => ReactNode;
  readonly legend: Card | null;
}) {
  return (
    <CardPoolData cardLister={cardLister} criteria={{ supertypeIds: ["Champion"] }}>
      {(pool) => children({ ...pool, cards: eligibleChampions(pool.cards, legend) })}
    </CardPoolData>
  );
}

export { ChampionPoolData };
