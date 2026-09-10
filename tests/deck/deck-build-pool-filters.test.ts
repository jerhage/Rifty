import { act, renderHook } from "@testing-library/react-native";

import { activePoolFilterCount, poolCriteria } from "@/features/deck/presentation/deck-zone-pool";
import type {
  DeckBuildCapabilities,
  DeckBuildStart,
} from "@/features/deck/presentation/deck-build-start";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";

import { fixedClock, sequentialIds } from "./fixtures";

const capabilities: DeckBuildCapabilities = {
  clock: fixedClock("2026-09-01T10:00:00.000Z"),
  deckLister: { getAll: async () => [] },
  deckSaver: { save: async () => undefined },
  idGenerator: sequentialIds(),
};

const start: DeckBuildStart = { type: "new" };

async function renderBuild() {
  return await renderHook(() =>
    useDeckBuild(start, capabilities, { onExit: () => undefined, onSaved: () => undefined }),
  );
}

describe("deck build pool filters", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("edits the draft without touching the applied filters or the pool query", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.toggleDomain("Fury"));
    await act(() => result.current.pool.toggleType("Spell"));

    expect(result.current.pool.draftFilters.keywordIds).toEqual(["shield"]);
    expect(result.current.pool.draftFilters.domainIds).toEqual(["Fury"]);
    expect(result.current.pool.draftFilters.typeIds).toEqual(["Spell"]);
    expect(result.current.pool.filters.keywordIds).toEqual([]);
    expect(result.current.pool.filters.domainIds).toEqual([]);
    expect(result.current.pool.filters.typeIds).toEqual([]);

    const criteria = poolCriteria(
      result.current.pool.zone,
      result.current.pool.filters,
      result.current.pool.searchQuery,
    );
    expect(criteria.keywordIds).toBeUndefined();
    expect(criteria.anyDomainIds).toBeUndefined();
    expect(criteria.typeIds).toEqual(["Unit", "Spell", "Gear"]);
  });

  it("commits the draft when the sheet is confirmed", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());

    expect(result.current.pool.filters.keywordIds).toEqual(["shield"]);
    expect(result.current.pool.isFilterOpen).toBe(false);
    expect(
      poolCriteria(
        result.current.pool.zone,
        result.current.pool.filters,
        result.current.pool.searchQuery,
      ).keywordIds,
    ).toEqual(["shield"]);
  });

  it("discards the draft when the sheet is dismissed without confirming", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("tank"));
    await act(() => result.current.pool.toggleDomain("Calm"));
    await act(() => result.current.pool.dismissFilters());

    expect(result.current.pool.filters.keywordIds).toEqual(["shield"]);
    expect(result.current.pool.filters.domainIds).toEqual([]);
    expect(result.current.pool.draftFilters.keywordIds).toEqual(["shield"]);
    expect(result.current.pool.draftFilters.domainIds).toEqual([]);
  });

  it("reopens the sheet on the applied filters rather than an abandoned draft", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleType("Gear"));
    await act(() => result.current.pool.dismissFilters());
    await act(() => result.current.pool.openFilters());

    expect(result.current.pool.draftFilters.typeIds).toEqual([]);
  });

  it("resets only the draft, leaving the pool as it is until confirmed", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.resetFilters());

    expect(result.current.pool.draftFilters.keywordIds).toEqual([]);
    expect(result.current.pool.filters.keywordIds).toEqual(["shield"]);
  });

  it("leaves the search text alone when the filters are reset", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.setQuery("volibear"));
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.resetFilters());

    expect(result.current.pool.draftFilters.keywordIds).toEqual([]);
    expect(result.current.pool.query).toBe("volibear");
  });

  it("counts the applied filters on the badge, not the ones being chosen", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.toggleType("Spell"));

    expect(activePoolFilterCount(result.current.pool.filters)).toBe(0);
    expect(activePoolFilterCount(result.current.pool.draftFilters)).toBe(2);

    await act(() => result.current.pool.applyFilters());

    expect(activePoolFilterCount(result.current.pool.filters)).toBe(2);
  });

  it("clears both the applied filters and the draft when the zone changes", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("tank"));

    await act(() => result.current.pool.setZone("runeDeck"));

    expect(result.current.pool.filters.keywordIds).toEqual([]);
    expect(result.current.pool.draftFilters.keywordIds).toEqual([]);
  });

  it("clears the search text when the zone changes", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.setQuery("volibear"));
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    await act(() => result.current.pool.setZone("runeDeck"));
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.pool.query).toBe("");
    expect(result.current.pool.searchQuery).toBe("");
  });

  it("keeps the search field live, debounced rather than deferred to the sheet", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.setQuery("volibear"));

    expect(result.current.pool.query).toBe("volibear");
    expect(result.current.pool.searchQuery).toBe("");

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.pool.searchQuery).toBe("volibear");
    expect(
      poolCriteria(
        result.current.pool.zone,
        result.current.pool.filters,
        result.current.pool.searchQuery,
      ).search,
    ).toEqual({
      type: "nameOrRulesText",
      text: "volibear",
    });
  });

  it("keeps the search text through a confirmed sheet", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.setQuery("volibear"));
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());

    expect(result.current.pool.query).toBe("volibear");
    expect(result.current.pool.filters.keywordIds).toEqual(["shield"]);
  });
});
