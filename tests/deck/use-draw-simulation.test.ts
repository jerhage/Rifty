import { act, renderHook } from "@testing-library/react-native";

import type { CardCopy } from "@/features/analysis/card-copy";
import { MULLIGAN_LIMIT } from "@/features/analysis/draw-simulation";
import {
  useDrawSimulation,
  type ShuffleCards,
} from "@/features/deck/presentation/hooks/use-draw-simulation";

import { card } from "../card/fixtures";

const one = card("one", "OGN", { name: "Card one" });
const two = card("two", "OGN", { name: "Card two" });
const three = card("three", "OGN", { name: "Card three" });
const four = card("four", "OGN", { name: "Card four" });
const five = card("five", "OGN", { name: "Card five" });
const six = card("six", "OGN", { name: "Card six" });

const library: readonly CardCopy[] = [
  { card: one, quantity: 1 },
  { card: two, quantity: 1 },
  { card: three, quantity: 1 },
  { card: four, quantity: 1 },
  { card: five, quantity: 1 },
  { card: six, quantity: 1 },
];

const exactHand: readonly CardCopy[] = library.slice(0, 4);
const shortLibrary: readonly CardCopy[] = library.slice(0, 2);

/** Rotates one place further on every deal, so each hand is different and still deterministic. */
function rotatingShuffle(): ShuffleCards {
  let deals = 0;

  return <Item>(items: readonly Item[]): readonly Item[] => {
    const offset = items.length === 0 ? 0 : deals++ % items.length;

    return [...items.slice(offset), ...items.slice(0, offset)];
  };
}

async function renderSimulation(copies: readonly CardCopy[] = library) {
  const shuffleCards = rotatingShuffle();
  const { result } = await renderHook(() => useDrawSimulation(copies, shuffleCards));

  return result;
}

function printings(cards: readonly { readonly printingId: string }[]): readonly string[] {
  return cards.map((held) => held.printingId);
}

describe("draw simulation", () => {
  it("should deal an opening hand off the top of the shuffled pool", async () => {
    const result = await renderSimulation();

    expect(printings(result.current.hand)).toEqual(["one", "two", "three", "four"]);
    expect(result.current.handNumber).toBe(1);
    expect(result.current.selected).toEqual([]);
    expect(result.current.mulligan).toEqual({ type: "awaitingSelection" });
    expect(result.current.notice).toEqual({ type: "none" });
  });

  it("should deal every card it can when the deck is smaller than an opening hand", async () => {
    const result = await renderSimulation(shortLibrary);

    expect(printings(result.current.hand)).toEqual(["one", "two"]);
  });

  it("should count a fresh hand and deal a different one", async () => {
    const result = await renderSimulation();

    await act(() => result.current.dealFreshHand());

    expect(printings(result.current.hand)).toEqual(["two", "three", "four", "five"]);
    expect(result.current.handNumber).toBe(2);
  });

  it("should select a card and deselect it again", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(2));

    expect(result.current.selected).toEqual([2]);
    expect(result.current.mulligan).toEqual({ type: "ready", count: 1 });
    expect(result.current.notice).toEqual({ type: "none" });

    await act(() => result.current.toggleSelection(2));

    expect(result.current.selected).toEqual([]);
    expect(result.current.mulligan).toEqual({ type: "awaitingSelection" });
  });

  it("should warn and keep the selection when the limit is reached", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(0));
    await act(() => result.current.toggleSelection(1));
    await act(() => result.current.toggleSelection(2));

    expect(result.current.selected).toEqual([0, 1]);
    expect(result.current.selected).toHaveLength(MULLIGAN_LIMIT);
    expect(result.current.mulligan).toEqual({ type: "ready", count: MULLIGAN_LIMIT });
    expect(result.current.notice).toEqual({ type: "selectionLimit" });
  });

  it("should clear the limit warning once a chosen card is deselected", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(0));
    await act(() => result.current.toggleSelection(1));
    await act(() => result.current.toggleSelection(2));
    await act(() => result.current.toggleSelection(1));

    expect(result.current.selected).toEqual([0]);
    expect(result.current.notice).toEqual({ type: "none" });
  });

  it("should replace only the chosen cards when the mulligan is taken", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(0));
    await act(() => result.current.toggleSelection(2));
    await act(() => result.current.takeMulligan());

    expect(printings(result.current.hand)).toEqual(["five", "two", "six", "four"]);
    expect(result.current.mulligan).toEqual({ type: "spent", replaced: 2 });
    expect(result.current.selected).toEqual([]);
    expect(result.current.notice).toEqual({ type: "none" });
    expect(result.current.handNumber).toBe(1);
  });

  it("should report a mulligan that redrew nothing when the deck ran out", async () => {
    const result = await renderSimulation(exactHand);

    await act(() => result.current.toggleSelection(1));
    await act(() => result.current.takeMulligan());

    expect(printings(result.current.hand)).toEqual(["one", "two", "three", "four"]);
    expect(result.current.mulligan).toEqual({ type: "spent", replaced: 0 });
  });

  it("should leave the hand alone when a mulligan is taken with nothing chosen", async () => {
    const result = await renderSimulation();

    await act(() => result.current.takeMulligan());

    expect(printings(result.current.hand)).toEqual(["one", "two", "three", "four"]);
    expect(result.current.mulligan).toEqual({ type: "awaitingSelection" });
    expect(result.current.notice).toEqual({ type: "none" });
  });

  it("should warn and hold the hand when a card is tapped after the mulligan is spent", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(0));
    await act(() => result.current.takeMulligan());
    await act(() => result.current.toggleSelection(3));

    expect(result.current.notice).toEqual({ type: "mulliganSpent" });
    expect(result.current.selected).toEqual([]);
    expect(printings(result.current.hand)).toEqual(["five", "two", "three", "four"]);
  });

  it("should warn when a second mulligan is attempted", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(0));
    await act(() => result.current.takeMulligan());
    await act(() => result.current.takeMulligan());

    expect(result.current.notice).toEqual({ type: "mulliganSpent" });
    expect(result.current.mulligan).toEqual({ type: "spent", replaced: 1 });
  });

  it("should restore the mulligan and clear the warning when a fresh hand is dealt", async () => {
    const result = await renderSimulation();

    await act(() => result.current.toggleSelection(0));
    await act(() => result.current.takeMulligan());
    await act(() => result.current.takeMulligan());
    await act(() => result.current.dealFreshHand());

    expect(result.current.mulligan).toEqual({ type: "awaitingSelection" });
    expect(result.current.notice).toEqual({ type: "none" });
    expect(result.current.selected).toEqual([]);
    expect(result.current.handNumber).toBe(2);
  });
});
