import { act, renderHook } from "@testing-library/react-native";

import { activePoolFilterCount, poolCriteria } from "@/features/deck/presentation/deck-zone-pool";
import {
  useDeckBuild,
  type DeckBuildCapabilities,
  type DeckBuildStart,
} from "@/features/deck/presentation/hooks/use-deck-build";

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

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.togglePoolDomain("Fury"));
    await act(() => result.current.togglePoolType("Spell"));

    expect(result.current.draftPoolFilters.keywordIds).toEqual(["shield"]);
    expect(result.current.draftPoolFilters.domainIds).toEqual(["Fury"]);
    expect(result.current.draftPoolFilters.typeIds).toEqual(["Spell"]);
    expect(result.current.poolFilters.keywordIds).toEqual([]);
    expect(result.current.poolFilters.domainIds).toEqual([]);
    expect(result.current.poolFilters.typeIds).toEqual([]);

    const criteria = poolCriteria(
      result.current.zone,
      result.current.poolFilters,
      result.current.debouncedPoolQuery,
    );
    expect(criteria.keywordIds).toBeUndefined();
    expect(criteria.anyDomainIds).toBeUndefined();
    expect(criteria.typeIds).toEqual(["Unit", "Spell", "Gear"]);
  });

  it("commits the draft when the sheet is confirmed", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.applyPoolFilters());

    expect(result.current.poolFilters.keywordIds).toEqual(["shield"]);
    expect(result.current.isPoolFilterOpen).toBe(false);
    expect(
      poolCriteria(
        result.current.zone,
        result.current.poolFilters,
        result.current.debouncedPoolQuery,
      ).keywordIds,
    ).toEqual(["shield"]);
  });

  it("discards the draft when the sheet is dismissed without confirming", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.applyPoolFilters());

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("tank"));
    await act(() => result.current.togglePoolDomain("Calm"));
    await act(() => result.current.dismissPoolFilters());

    expect(result.current.poolFilters.keywordIds).toEqual(["shield"]);
    expect(result.current.poolFilters.domainIds).toEqual([]);
    expect(result.current.draftPoolFilters.keywordIds).toEqual(["shield"]);
    expect(result.current.draftPoolFilters.domainIds).toEqual([]);
  });

  it("reopens the sheet on the applied filters rather than an abandoned draft", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolType("Gear"));
    await act(() => result.current.dismissPoolFilters());
    await act(() => result.current.openPoolFilters());

    expect(result.current.draftPoolFilters.typeIds).toEqual([]);
  });

  it("resets only the draft, leaving the pool as it is until confirmed", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.applyPoolFilters());

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.resetPoolFilters());

    expect(result.current.draftPoolFilters.keywordIds).toEqual([]);
    expect(result.current.poolFilters.keywordIds).toEqual(["shield"]);
  });

  it("leaves the search text alone when the filters are reset", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.setPoolQuery("volibear"));
    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.resetPoolFilters());

    expect(result.current.draftPoolFilters.keywordIds).toEqual([]);
    expect(result.current.poolQuery).toBe("volibear");
  });

  it("counts the applied filters on the badge, not the ones being chosen", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.togglePoolType("Spell"));

    expect(activePoolFilterCount(result.current.poolFilters)).toBe(0);
    expect(activePoolFilterCount(result.current.draftPoolFilters)).toBe(2);

    await act(() => result.current.applyPoolFilters());

    expect(activePoolFilterCount(result.current.poolFilters)).toBe(2);
  });

  it("clears both the applied filters and the draft when the zone changes", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.applyPoolFilters());
    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("tank"));

    await act(() => result.current.setZone("runeDeck"));

    expect(result.current.poolFilters.keywordIds).toEqual([]);
    expect(result.current.draftPoolFilters.keywordIds).toEqual([]);
  });

  it("clears the search text when the zone changes", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.setPoolQuery("volibear"));
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    await act(() => result.current.setZone("runeDeck"));
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.poolQuery).toBe("");
    expect(result.current.debouncedPoolQuery).toBe("");
  });

  it("keeps the search field live, debounced rather than deferred to the sheet", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.setPoolQuery("volibear"));

    expect(result.current.poolQuery).toBe("volibear");
    expect(result.current.debouncedPoolQuery).toBe("");

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.debouncedPoolQuery).toBe("volibear");
    expect(
      poolCriteria(
        result.current.zone,
        result.current.poolFilters,
        result.current.debouncedPoolQuery,
      ).search,
    ).toEqual({
      type: "nameOrRulesText",
      text: "volibear",
    });
  });

  it("keeps the search text through a confirmed sheet", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.setPoolQuery("volibear"));
    await act(() => result.current.openPoolFilters());
    await act(() => result.current.togglePoolKeyword("shield"));
    await act(() => result.current.applyPoolFilters());

    expect(result.current.poolQuery).toBe("volibear");
    expect(result.current.poolFilters.keywordIds).toEqual(["shield"]);
  });
});
