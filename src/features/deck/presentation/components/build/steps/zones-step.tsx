import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import { useLayoutSize } from "@/hooks/use-layout-size";

import type { DeckBuildStepId } from "../../../deck-build-steps";
import { zonePoolViewChoice } from "../../../deck-zone-pool";
import type { ZoneDraftViewState, ZonePoolViewState } from "../../../hooks/use-deck-build";
import { ZonePoolList } from "../zone-pool-list";
import { ZonesStepColumns } from "./zones-step-columns";
import { ZonesStepHeader } from "./zones-step-header";

interface ZonesStepProps {
  readonly draft: ZoneDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly pool: ZonePoolViewState;
  readonly zonePool: readonly Card[];
}

/** The one place this step reads the layout class: the pool, the tiles and the header never do. */
function ZonesStep({
  draft,
  onChangeName,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  pool,
  zonePool,
}: ZonesStepProps) {
  const { layoutClass } = useLayoutSize();
  const viewChoice = zonePoolViewChoice(pool.view, layoutClass);

  return match(layoutClass)
    .with("phone", () => (
      <>
        <ZonesStepHeader
          draft={draft}
          onChangeName={onChangeName}
          onEditStep={onEditStep}
          pool={pool}
          viewChoice={viewChoice}
        />

        <ZonePoolList
          draft={draft.draft}
          onLoadMorePool={onLoadMorePool}
          onOpenCard={onOpenCard}
          onSetQuantity={draft.setQuantity}
          poolLayout={pool.layout}
          poolView={viewChoice.shown}
          zone={pool.zone}
          zonePool={zonePool}
        />
      </>
    ))
    .with("tablet", () => (
      <ZonesStepColumns
        draft={draft}
        onChangeName={onChangeName}
        onEditStep={onEditStep}
        onLoadMorePool={onLoadMorePool}
        onOpenCard={onOpenCard}
        pool={pool}
        viewChoice={viewChoice}
        zonePool={zonePool}
      />
    ))
    .exhaustive();
}

export { ZonesStep };
export type { ZonesStepProps };
