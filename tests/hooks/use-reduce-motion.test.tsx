import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Listener = (isReduced: boolean) => void;

interface CapturedSubscription {
  readonly listeners: Listener[];
  notify(isReduced: boolean): void;
  removals(): number;
}

function captureSubscription(): CapturedSubscription {
  const listeners: Listener[] = [];
  let removals = 0;

  const subscribe = jest.spyOn(AccessibilityInfo, "addEventListener") as unknown as jest.Mock;
  subscribe.mockImplementation((event: string, listener: Listener) => {
    if (event === "reduceMotionChanged") listeners.push(listener);

    return {
      remove: () => {
        removals += 1;
      },
    };
  });

  return {
    listeners,
    notify: (isReduced) => {
      for (const listener of listeners) listener(isReduced);
    },
    removals: () => removals,
  };
}

describe("useReduceMotion", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should report the setting the platform starts with", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const { result } = await renderHook(() => useReduceMotion());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("should follow the setting when it changes while the app is open", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    const { listeners, notify } = captureSubscription();
    const { result } = await renderHook(() => useReduceMotion());

    await waitFor(() => expect(listeners).toHaveLength(1));
    await act(async () => {
      notify(true);
    });

    expect(result.current).toBe(true);
  });

  it("should drop the subscription when the component goes away", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    const { removals } = captureSubscription();
    const { unmount } = await renderHook(() => useReduceMotion());

    await act(async () => {
      unmount();
    });

    expect(removals()).toBe(1);
  });
});
