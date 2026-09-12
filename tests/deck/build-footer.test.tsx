import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BuildFooter } from "@/features/deck/presentation/components/build/build-footer";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

async function renderFooter(isActionEnabled: boolean) {
  const actions: number[] = [];

  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BuildFooter
        actionLabel="Continue"
        isActionEnabled={isActionEnabled}
        onAction={() => actions.push(1)}
      >
        <Text>No Legend yet</Text>
      </BuildFooter>
    </SafeAreaProvider>,
  );

  return { action: () => screen.getByRole("button", { name: "Continue" }), actions };
}

describe("BuildFooter", () => {
  it("should not run the action when the action is disabled", async () => {
    const { action, actions } = await renderFooter(false);

    expect(action().props.accessibilityState).toEqual({ disabled: true });

    await fireEvent.press(action());

    expect(actions).toEqual([]);
  });

  it("should run the action when the action is enabled", async () => {
    const { action, actions } = await renderFooter(true);

    expect(action().props.accessibilityState).toEqual({ disabled: false });

    await fireEvent.press(action());

    expect(actions).toEqual([1]);
  });
});
