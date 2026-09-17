import { act, renderHook } from "@testing-library/react-native";

import type { DeckBuildMode } from "@/features/deck/presentation/deck-build-mode";
import { poolCriteria } from "@/features/deck/presentation/deck-section-pool";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";

import { createTestWrapper } from "../test-wrapper";

const mode: DeckBuildMode = { type: "create" };

async function renderBuild() {
  return await renderHook(() => useDeckBuild(mode, { onExit: () => undefined }), {
    wrapper: createTestWrapper(),
  });
}

function criteriaOf(pool: {
  readonly filters: Parameters<typeof poolCriteria>[1];
  readonly searchQuery: string;
  readonly sort: Parameters<typeof poolCriteria>[3];
  readonly section: Parameters<typeof poolCriteria>[0];
}) {
  return poolCriteria(pool.section, pool.filters, pool.searchQuery, pool.sort);
}

describe("deck build pool sort", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should open the pool alphabetically", async () => {
    const { result } = await renderBuild();

    expect(criteriaOf(result.current.pool).sort).toEqual({
      type: "name",
      direction: "ascending",
    });
  });

  it("should leave the pool query alone until the sort sheet is confirmed", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openSort());
    await act(() => result.current.pool.changeSort({ type: "energy", direction: "ascending" }));

    expect(result.current.pool.draftSort).toEqual({ type: "energy", direction: "ascending" });
    expect(criteriaOf(result.current.pool).sort).toEqual({
      type: "name",
      direction: "ascending",
    });

    await act(() => result.current.pool.applySort());

    expect(criteriaOf(result.current.pool).sort).toEqual({
      type: "energy",
      direction: "ascending",
    });
    expect(result.current.pool.sheet).toEqual({ type: "hidden" });
  });

  it("should discard an abandoned ordering when the sheet is dismissed", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openSort());
    await act(() => result.current.pool.changeSort({ type: "might", direction: "descending" }));
    await act(() => result.current.pool.dismissSheet());

    expect(criteriaOf(result.current.pool).sort).toEqual({
      type: "name",
      direction: "ascending",
    });
    expect(result.current.pool.draftSort).toEqual({ type: "name", direction: "ascending" });
  });

  it("should reverse the applied ordering in place, without the sheet", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.toggleSortDirection());

    expect(criteriaOf(result.current.pool).sort).toEqual({
      type: "name",
      direction: "descending",
    });
    expect(result.current.pool.sheet).toEqual({ type: "hidden" });
  });

  it("should ask the query for catalog order when catalog order is chosen", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openSort());
    await act(() => result.current.pool.changeSort({ type: "catalogOrder" }));
    await act(() => result.current.pool.applySort());

    expect(criteriaOf(result.current.pool).sort).toEqual({ type: "catalogOrder" });
  });

  it("should keep the chosen ordering when the section changes, unlike the filters", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openSort());
    await act(() => result.current.pool.changeSort({ type: "energy", direction: "ascending" }));
    await act(() => result.current.pool.applySort());

    await act(() => result.current.pool.setSection("runeDeck"));

    expect(criteriaOf(result.current.pool).sort).toEqual({
      type: "energy",
      direction: "ascending",
    });
  });

  it("should show one face at a time, whichever was opened last", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.pool.openSort());

    expect(result.current.pool.sheet).toEqual({ type: "sort" });

    await act(() => result.current.pool.dismissSheet());
    await act(() => result.current.pool.openFilters());

    expect(result.current.pool.sheet).toEqual({ type: "filter" });
  });
});
