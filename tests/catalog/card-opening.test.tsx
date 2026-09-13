import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { AccessibilityInfo, Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { CardSummary } from "@/features/card/card-summary";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import {
  useCardOpening,
  type CardOpening,
} from "@/features/catalog/presentation/hooks/use-card-opening";

const ZED: CardSummary = {
  printingId: printingIdSchema.parse("ogn-001"),
  riftboundId: "ogn-001-100",
  name: "Zed",
  domainIds: ["Fury", "Body"],
  orientation: "portrait",
  imageUrl: "http://localhost:8787/ogn-001-100.webp",
};

const AHRI: CardSummary = { ...ZED, printingId: printingIdSchema.parse("ogn-002"), name: "Ahri" };

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
  const pushCardRoute = jest.fn();
  const { result } = await renderHook(() => useCardOpening(pushCardRoute), {
    wrapper: frameWrapper(width, height),
  });

  return { pushCardRoute, result };
}

function paneOf(opening: CardOpening) {
  if (opening.type !== "pane") throw new Error(`expected a pane, got ${opening.type}`);

  return opening;
}

describe("useCardOpening on a phone", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should push the card's own route rather than hold it beside the grid", async () => {
    const { pushCardRoute, result } = await openingOn(402, 874);

    expect(result.current.type).toBe("route");
    await act(async () => result.current.openCard(ZED));

    expect(pushCardRoute).toHaveBeenCalledWith(ZED.printingId);
  });

  it("should stay a pushed route in landscape, where the frame is still a phone's", async () => {
    expect((await openingOn(874, 402)).result.current.type).toBe("route");
  });
});

describe("useCardOpening on a tablet", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should show the picked card beside the grid without navigating", async () => {
    const { pushCardRoute, result } = await openingOn(1032, 1376);

    expect(paneOf(result.current).shownCardId).toBeNull();
    await act(async () => result.current.openCard(ZED));

    expect(paneOf(result.current).shownCardId).toBe(ZED.printingId);
    expect(pushCardRoute).not.toHaveBeenCalled();
  });

  it("should replace the shown card when another is picked", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.openCard(ZED));
    await act(async () => result.current.openCard(AHRI));

    expect(paneOf(result.current).shownCardId).toBe(AHRI.printingId);
  });

  it("should clear the pane when the card is closed", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.openCard(ZED));
    await act(async () => paneOf(result.current).closeCard());

    expect(paneOf(result.current).shownCardId).toBeNull();
  });

  it("should speak the change the screen reader gets no transition for", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
      .mockImplementation(() => undefined);
    announce.mockClear();
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.openCard(ZED));
    await act(async () => paneOf(result.current).closeCard());

    expect(announce.mock.calls.map(([message]) => message)).toEqual([
      "Zed opened beside the grid.",
      "Card closed.",
    ]);
  });
});
