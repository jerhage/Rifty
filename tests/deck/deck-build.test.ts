import { act, renderHook, waitFor } from "@testing-library/react-native";

import type {
  DeckBuildCapabilities,
  DeckBuildStart,
} from "@/features/deck/presentation/deck-build-start";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";

import { card } from "../card/fixtures";
import { createTestWrapper } from "../test-wrapper";

import { deck, fixedClock, sequentialIds } from "./fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear",
  domainIds: ["Fury"],
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const otherLegend = card("legend-two", "OGN", {
  name: "Lux",
  domainIds: ["Mind"],
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const champion = card("champion", "OGN", {
  name: "Yasuo",
  classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
});

async function buildFor(start: DeckBuildStart, exits: { onExit: () => void; onSaved: () => void }) {
  const saves = jest.fn(async () => undefined);
  const capabilities: DeckBuildCapabilities = {
    clock: fixedClock("2026-09-01T10:00:00.000Z"),
    deckLister: { getAll: async () => [] },
    deckSaver: { save: saves },
    idGenerator: sequentialIds(),
  };
  const rendered = await renderHook(() => useDeckBuild(start, capabilities, exits), {
    wrapper: createTestWrapper(),
  });

  return { rendered, saves };
}

async function renderBuild(start: DeckBuildStart = { type: "new" }) {
  const onExit = jest.fn();
  const onSaved = jest.fn();
  const { rendered, saves } = await buildFor(start, { onExit, onSaved });

  return { onExit, onSaved, result: rendered.result, saves };
}

describe("deck build", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should open a new deck on the first step and an edit on the zones step", async () => {
    expect((await renderBuild()).result.current.steps.step.id).toBe("legend");

    const editing = await renderBuild({ type: "edit", cards: [], deck: deck("deck-1") });

    expect(editing.result.current.steps.step.id).toBe("zones");
  });

  it("should leave the builder when back is pressed on the first step", async () => {
    const { onExit, result } = await renderBuild();

    await act(() => result.current.steps.back());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(result.current.steps.step.id).toBe("legend");
  });

  it("should reset the pool to the legend's domains and clear the query on the zones step", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.pool.setQuery("storm"));
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());
    await act(() => result.current.steps.next());
    await act(() => result.current.steps.next());

    expect(result.current.steps.step.id).toBe("zones");
    expect(result.current.pool.filters.domainIds).toEqual(["Fury"]);
    expect(result.current.pool.filters.keywordIds).toEqual([]);
    expect(result.current.pool.query).toBe("");
  });

  it("should reset the pool to the legend's domains when the zone changes", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.steps.goToStep("zones"));
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleDomain("Fury"));
    await act(() => result.current.pool.applyFilters());

    expect(result.current.pool.filters.domainIds).toEqual([]);

    await act(() => result.current.pool.setZone("runeDeck"));

    expect(result.current.pool.zone).toBe("runeDeck");
    expect(result.current.pool.filters.domainIds).toEqual(["Fury"]);
  });

  it("should clear the chosen champion when a different legend is picked", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.draft.pickChampion(champion));

    expect(result.current.draft.draft.chosenChampion).toEqual(champion);

    await act(() => result.current.draft.pickLegend(otherLegend));

    expect(result.current.draft.draft.legend).toEqual(otherLegend);
    expect(result.current.draft.draft.chosenChampion).toBeNull();
  });

  it("should deselect a legend or a champion picked twice", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.draft.pickLegend(legend));

    expect(result.current.draft.draft.legend).toBeNull();

    await act(() => result.current.draft.pickChampion(champion));
    await act(() => result.current.draft.pickChampion(champion));

    expect(result.current.draft.draft.chosenChampion).toBeNull();
  });

  it("should keep one copy of the chosen champion in the main deck", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickChampion(champion));
    await act(() => result.current.draft.setQuantity("mainDeck", champion, 0));

    expect(
      result.current.draft.entries.find((entry) => entry.printingId === champion.printingId)
        ?.quantity,
    ).toBe(1);

    await act(() => result.current.draft.setQuantity("mainDeck", champion, 3));

    expect(
      result.current.draft.entries.find((entry) => entry.printingId === champion.printingId)
        ?.quantity,
    ).toBe(3);
  });

  it("should report a missing name rather than write a deck that has none", async () => {
    const { onSaved, result, saves } = await renderBuild();

    await act(() => result.current.saving.save());

    await waitFor(() => expect(result.current.saving.state).toEqual({ type: "nameMissing" }));
    expect(saves).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should debounce the legend query while the field stays live", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.legends.setQuery("voli"));

    expect(result.current.legends.query).toBe("voli");
    expect(result.current.legends.searchQuery).toBe("");

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.legends.searchQuery).toBe("voli");
  });
});
