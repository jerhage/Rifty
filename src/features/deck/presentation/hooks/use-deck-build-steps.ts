import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import type { DeckBuildStart } from "../deck-build-start";
import { DECK_BUILD_STEPS, type DeckBuildStep } from "../deck-build-steps";

const ZONES_STEP_INDEX = DECK_BUILD_STEPS.findIndex((step) => step.id === "zones");

function useDeckBuildSteps(
  start: DeckBuildStart,
  {
    onEnterStep,
    onExit,
  }: { readonly onEnterStep: (step: DeckBuildStep) => void; readonly onExit: () => void },
) {
  const [stepIndex, setStepIndex] = useState(() => openingStep(start));

  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(index);
      onEnterStep(stepAt(index));
    },
    [onEnterStep],
  );

  const next = useCallback(
    () => goToStep(Math.min(DECK_BUILD_STEPS.length - 1, stepIndex + 1)),
    [goToStep, stepIndex],
  );

  const back = useCallback(() => {
    if (stepIndex === 0) {
      onExit();
      return;
    }

    goToStep(stepIndex - 1);
  }, [goToStep, onExit, stepIndex]);

  return { back, goToStep, mode: start.type, next, step: stepAt(stepIndex), stepIndex };
}

function stepAt(index: number): DeckBuildStep {
  return DECK_BUILD_STEPS[index] ?? DECK_BUILD_STEPS[0];
}

function openingStep(start: DeckBuildStart): number {
  return match(start)
    .with({ type: "new" }, () => 0)
    .with({ type: "edit" }, () => ZONES_STEP_INDEX)
    .exhaustive();
}

export { useDeckBuildSteps };
