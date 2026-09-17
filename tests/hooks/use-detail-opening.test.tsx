import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { AccessibilityInfo, Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useDetailOpening, type DetailOpening } from "@/hooks/use-detail-opening";

interface Subject {
  readonly id: string;
  readonly name: string;
}

const ZED: Subject = { id: "ogn-001", name: "Zed" };
const AHRI: Subject = { id: "ogn-002", name: "Ahri" };

function idOf(subject: Subject): string {
  return subject.id;
}

function openedMessage(subject: Subject): string {
  return `${subject.name} opened beside the list.`;
}

function frameWrapper(width: number, height: number) {
  return function FrameWrapper({ children }: PropsWithChildren) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width, height },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        {children}
      </SafeAreaProvider>
    );
  };
}

async function openingOn(width: number, height: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);
  const pushRoute = jest.fn();
  const { result } = await renderHook(
    () => useDetailOpening({ closedMessage: "Thing closed.", idOf, openedMessage, pushRoute }),
    { wrapper: frameWrapper(width, height) },
  );

  return { pushRoute, result };
}

function paneOf(opening: DetailOpening<Subject, string>) {
  if (opening.type !== "pane") throw new Error(`expected a pane, got ${opening.type}`);

  return opening;
}

describe("useDetailOpening on a phone", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should push the subject's own route rather than hold it beside what it was picked from", async () => {
    const { pushRoute, result } = await openingOn(402, 874);

    expect(result.current.type).toBe("route");
    await act(async () => result.current.open(ZED));

    expect(pushRoute).toHaveBeenCalledWith(ZED.id);
  });

  it("should stay a pushed route in landscape, where the frame is still a phone's", async () => {
    expect((await openingOn(874, 402)).result.current.type).toBe("route");
  });
});

describe("useDetailOpening on a tablet", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should show the picked subject in the pane without navigating", async () => {
    const { pushRoute, result } = await openingOn(1032, 1376);

    expect(paneOf(result.current).shown).toEqual({ type: "noSubject" });
    await act(async () => result.current.open(ZED));

    expect(paneOf(result.current).shown).toEqual({ id: ZED.id, type: "subject" });
    expect(pushRoute).not.toHaveBeenCalled();
  });

  it("should replace the shown subject when another is picked", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(ZED));
    await act(async () => result.current.open(AHRI));

    expect(paneOf(result.current).shown).toEqual({ id: AHRI.id, type: "subject" });
  });

  it("should clear the pane when the subject is closed", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(ZED));
    await act(async () => paneOf(result.current).close());

    expect(paneOf(result.current).shown).toEqual({ type: "noSubject" });
  });

  it("should speak the change the screen reader gets no transition for", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
      .mockImplementation(() => undefined);
    announce.mockClear();
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(ZED));
    await act(async () => paneOf(result.current).close());

    expect(announce.mock.calls.map(([message]) => message)).toEqual([
      "Zed opened beside the list.",
      "Thing closed.",
    ]);
  });
});
