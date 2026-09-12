import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BuildProgressHeader } from "@/features/deck/presentation/components/build/build-progress-header";
import { stepFor, type DeckBuildStepId } from "@/features/deck/presentation/deck-build-steps";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

async function renderHeader(stepId: DeckBuildStepId) {
  const presses: string[] = [];

  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BuildProgressHeader
        mode="edit"
        onBack={() => presses.push("back")}
        onClose={() => presses.push("close")}
        step={stepFor(stepId)}
      />
    </SafeAreaProvider>,
  );

  return { presses };
}

describe("BuildProgressHeader", () => {
  it.each<DeckBuildStepId>(["legend", "chosenChampion", "zones"])(
    "should leave the builder in one press from the %s step",
    async (stepId) => {
      const { presses } = await renderHeader(stepId);

      await fireEvent.press(screen.getByRole("button", { name: "Close without saving" }));

      expect(presses).toEqual(["close"]);
    },
  );

  it("should walk the steps rather than leave when the back arrow is pressed", async () => {
    const { presses } = await renderHeader("zones");

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(presses).toEqual(["back"]);
  });
});
