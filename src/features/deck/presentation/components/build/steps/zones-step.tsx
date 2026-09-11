import type { Card } from "@/features/card/card";

import type { DeckBuildStepId } from "../../../deck-build-steps";
import type { ZoneDraftViewState, ZonePoolViewState } from "../../../hooks/use-deck-build";
import { ZonePoolList } from "../zone-pool-list";
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

function ZonesStep({
  draft,
  onChangeName,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  pool,
  zonePool,
}: ZonesStepProps) {
  return (
    <>
      <ZonesStepHeader
        draft={draft}
        onChangeName={onChangeName}
        onEditStep={onEditStep}
        pool={pool}
      />

      <ZonePoolList
        draft={draft.draft}
        onLoadMorePool={onLoadMorePool}
        onOpenCard={onOpenCard}
        onSetQuantity={draft.setQuantity}
        poolLayout={pool.layout}
        poolView={pool.view}
        zone={pool.zone}
        zonePool={zonePool}
      />
    </>
  );
}

export { ZonesStep };
export type { ZonesStepProps };
