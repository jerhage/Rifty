import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import type { DeckBuildMode } from "../deck-build-mode";
import { stepFor, type DeckBuildStep, type DeckBuildStepId } from "../deck-build-steps";

type StepAdvance =
  | { readonly type: "finished" }
  | { readonly type: "step"; readonly id: DeckBuildStepId };

type StepRetreat =
  | { readonly type: "exit" }
  | { readonly type: "step"; readonly id: DeckBuildStepId };

function useDeckBuildSteps(
  mode: DeckBuildMode,
  {
    onEnterStep,
    onExit,
  }: { readonly onEnterStep: (step: DeckBuildStep) => void; readonly onExit: () => void },
) {
  const [stepId, setStepId] = useState<DeckBuildStepId>(() => openingStepId(mode));

  const goToStep = useCallback(
    (id: DeckBuildStepId) => {
      setStepId(id);
      onEnterStep(stepFor(id));
    },
    [onEnterStep],
  );

  const next = useCallback(() => {
    match(advanceFrom(stepId))
      .with({ type: "finished" }, () => undefined)
      .with({ type: "step" }, ({ id }) => goToStep(id))
      .exhaustive();
  }, [goToStep, stepId]);

  const back = useCallback(() => {
    match(retreatFrom(stepId))
      .with({ type: "exit" }, () => onExit())
      .with({ type: "step" }, ({ id }) => goToStep(id))
      .exhaustive();
  }, [goToStep, onExit, stepId]);

  return { back, exit: onExit, goToStep, mode: mode.type, next, step: stepFor(stepId) };
}

function advanceFrom(id: DeckBuildStepId): StepAdvance {
  return match<DeckBuildStepId, StepAdvance>(id)
    .with("legend", () => ({ type: "step", id: "chosenChampion" }))
    .with("chosenChampion", () => ({ type: "step", id: "sections" }))
    .with("sections", () => ({ type: "finished" }))
    .exhaustive();
}

function retreatFrom(id: DeckBuildStepId): StepRetreat {
  return match<DeckBuildStepId, StepRetreat>(id)
    .with("legend", () => ({ type: "exit" }))
    .with("chosenChampion", () => ({ type: "step", id: "legend" }))
    .with("sections", () => ({ type: "step", id: "chosenChampion" }))
    .exhaustive();
}

function openingStepId(mode: DeckBuildMode): DeckBuildStepId {
  return match<DeckBuildMode, DeckBuildStepId>(mode)
    .with({ type: "create" }, () => "legend")
    .with({ type: "edit" }, () => "sections")
    .exhaustive();
}

export { useDeckBuildSteps };
