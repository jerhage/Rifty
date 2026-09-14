import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import { useLayoutSize } from "@/hooks/use-layout-size";

import type { DeckBuildStepId } from "../../../deck-build-steps";
import { sectionPoolViewChoice } from "../../../deck-section-pool";
import type { SectionDraftViewState, SectionPoolViewState } from "../../../hooks/use-deck-build";
import { SectionPoolList } from "../section-pool-list";
import { DeckDraftControls } from "./deck-draft-controls";
import { SectionPoolControls } from "./section-pool-controls";
import { SectionsStepColumns } from "./sections-step-columns";

interface SectionsStepProps {
  readonly draft: SectionDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly pool: SectionPoolViewState;
  readonly sectionPool: readonly Card[];
}

/** The one place this step reads the layout class: the pool, the tiles and the controls never do. */
function SectionsStep({
  draft,
  onChangeName,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  pool,
  sectionPool,
}: SectionsStepProps) {
  const { layoutClass } = useLayoutSize();
  const viewChoice = sectionPoolViewChoice(pool.view, layoutClass);

  return match(layoutClass)
    .with("phone", () => (
      <>
        <DeckDraftControls
          draft={draft}
          onChangeName={onChangeName}
          onEditStep={onEditStep}
          onSelectSection={pool.setSection}
          section={pool.section}
        />

        <SectionPoolControls draft={draft.draft} pool={pool} viewChoice={viewChoice} />

        <SectionPoolList
          draft={draft.draft}
          onLoadMorePool={onLoadMorePool}
          onOpenCard={onOpenCard}
          onSetQuantity={draft.setQuantity}
          poolLayout={pool.layout}
          poolView={viewChoice.shown}
          section={pool.section}
          sectionPool={sectionPool}
        />
      </>
    ))
    .with("tablet", () => (
      <SectionsStepColumns
        draft={draft}
        onChangeName={onChangeName}
        onEditStep={onEditStep}
        onLoadMorePool={onLoadMorePool}
        onOpenCard={onOpenCard}
        pool={pool}
        viewChoice={viewChoice}
        sectionPool={sectionPool}
      />
    ))
    .exhaustive();
}

export { SectionsStep };
export type { SectionsStepProps };
