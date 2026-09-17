import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  BuildFooter,
  type BuildActionAvailability,
} from "@/features/deck/presentation/components/build/build-footer";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

async function renderFooter(actionAvailability: BuildActionAvailability) {
  const actions: number[] = [];

  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BuildFooter
        actionAvailability={actionAvailability}
        actionLabel="Continue"
        onAction={() => actions.push(1)}
      >
        <Text>No Legend yet</Text>
      </BuildFooter>
    </SafeAreaProvider>,
  );

  return { action: () => screen.getByRole("button", { name: "Continue" }), actions };
}

describe("BuildFooter", () => {
  it("should report a busy action while the work it starts is in flight", async () => {
    const { action } = await renderFooter("busy");

    expect(action().props.accessibilityState).toEqual({ busy: true, disabled: true });
  });

  it("should not run the action while the work it starts is in flight", async () => {
    const { action, actions } = await renderFooter("busy");

    await fireEvent.press(action());

    expect(actions).toEqual([]);
  });

  it("should run the action when the action is ready", async () => {
    const { action, actions } = await renderFooter("ready");

    expect(action().props.accessibilityState).toEqual({ busy: false, disabled: false });

    await fireEvent.press(action());

    expect(actions).toEqual([1]);
  });
});
