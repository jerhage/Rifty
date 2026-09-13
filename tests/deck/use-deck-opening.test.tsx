import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { AccessibilityInfo, Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  useDeckOpening,
  type DeckOpening,
} from "@/features/deck/presentation/hooks/use-deck-opening";

import { deck } from "./fixtures";

const AGGRO = deck("aggro", { name: "Aggro" });
const CONTROL = deck("control", { name: "Control" });

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
  const pushDeckRoute = jest.fn();
  const { result } = await renderHook(() => useDeckOpening(pushDeckRoute), {
    wrapper: frameWrapper(width, height),
  });

  return { pushDeckRoute, result };
}

function paneOf(opening: DeckOpening) {
  if (opening.type !== "pane") throw new Error(`expected a pane, got ${opening.type}`);

  return opening;
}

describe("useDeckOpening on a phone", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should push the deck's own route, leaving the draw simulation a pushed screen too", async () => {
    const { pushDeckRoute, result } = await openingOn(402, 874);

    expect(result.current.type).toBe("route");
    await act(async () => result.current.open(AGGRO));

    expect(pushDeckRoute).toHaveBeenCalledWith(AGGRO.id);
  });
});

describe("useDeckOpening on a tablet", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should show nothing until a deck is picked", async () => {
    const { result } = await openingOn(1032, 1376);

    expect(paneOf(result.current).shown).toEqual({ type: "noDeck" });
  });

  it("should show the picked deck's detail", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));

    expect(paneOf(result.current).shown).toEqual({ deckId: AGGRO.id, type: "detail" });
  });

  it("should replace the detail with the draw simulation of the deck it was opened for", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(AGGRO.id));

    expect(paneOf(result.current).shown).toEqual({ deckId: AGGRO.id, type: "drawSimulation" });
  });

  it("should show the detail again when the simulated deck is not the shown one", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(CONTROL.id));

    expect(paneOf(result.current).shown).toEqual({ deckId: AGGRO.id, type: "detail" });
  });

  it("should return to the detail when another deck is picked, without any reset", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(AGGRO.id));
    await act(async () => result.current.open(CONTROL));

    expect(paneOf(result.current).shown).toEqual({ deckId: CONTROL.id, type: "detail" });
  });

  it("should show the detail when a deck is picked again after its simulation was left open", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(AGGRO.id));
    await act(async () => result.current.open(CONTROL));
    await act(async () => result.current.open(AGGRO));

    expect(paneOf(result.current).shown).toEqual({ deckId: AGGRO.id, type: "detail" });
  });

  it("should return to the detail of the same deck when the simulation is left", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(AGGRO.id));
    await act(async () => paneOf(result.current).returnToDetail());

    expect(paneOf(result.current).shown).toEqual({ deckId: AGGRO.id, type: "detail" });
  });

  it("should clear the shown deck and its simulation when the pane is closed", async () => {
    const { result } = await openingOn(1032, 1376);

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(AGGRO.id));
    await act(async () => paneOf(result.current).close());

    expect(paneOf(result.current).shown).toEqual({ type: "noDeck" });

    await act(async () => result.current.open(AGGRO));

    expect(paneOf(result.current).shown).toEqual({ deckId: AGGRO.id, type: "detail" });
  });

  it("should speak both directions, which no navigation announces", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
      .mockImplementation(() => undefined);
    const { result } = await openingOn(1032, 1376);
    announce.mockClear();

    await act(async () => result.current.open(AGGRO));
    await act(async () => paneOf(result.current).openDrawSimulation(AGGRO.id));
    await act(async () => paneOf(result.current).returnToDetail());

    expect(announce.mock.calls.map(([message]) => message)).toEqual([
      "Aggro opened beside the list.",
      "Draw simulation opened in place of the deck.",
      "Draw simulation closed. The deck is shown again.",
    ]);
  });
});
