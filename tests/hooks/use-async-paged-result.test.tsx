import { act, renderHook } from "@testing-library/react-native";
import { useCallback } from "react";
import { match } from "ts-pattern";

import { useAsyncPagedResult, type PagedRun } from "@/hooks/use-async-paged-result";
import { useStableValue } from "@/hooks/use-stable-value";
import { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

const PAGE_SIZE = 2;
const LOAD_MORE_ERROR = "Could not load more.";
const TOTAL = 4;

interface Criteria {
  readonly typeIds: readonly string[];
}

type Read =
  | { readonly type: "success"; readonly page: Page<string>; readonly total: number }
  | { readonly type: "listFailed" };

interface RecordedRead {
  readonly criteria: Criteria;
  readonly limit: number;
  readonly offset: number;
  readonly signal: AbortSignal | undefined;
  settle(read: Read): void;
}

type Lister = (
  criteria: Criteria,
  request: { readonly limit: number; readonly offset: number },
  options: ReadOptions,
) => Promise<Read>;

interface HarnessProps {
  readonly criteria: Criteria;
  readonly list: Lister;
}

function createLister(): { readonly list: Lister; readonly reads: RecordedRead[] } {
  const reads: RecordedRead[] = [];
  const list: Lister = (criteria, request, options) =>
    new Promise<Read>((resolve) => {
      reads.push({
        criteria,
        limit: request.limit,
        offset: request.offset,
        signal: options.signal,
        settle: resolve,
      });
    });

  return { list, reads };
}

function useHarness({ criteria, list }: HarnessProps) {
  const stableCriteria = useStableValue(criteria);
  const run = useCallback<PagedRun<string>>(
    ({ limit, offset }, options) => list(stableCriteria, { limit, offset }, options),
    [list, stableCriteria],
  );

  return useAsyncPagedResult<string>({
    loadMoreErrorMessage: LOAD_MORE_ERROR,
    pageSize: PAGE_SIZE,
    run,
  });
}

type Harness = ReturnType<typeof useHarness>;

function loadedPage(harness: Harness) {
  return match(harness.state)
    .with({ type: "success" }, (successful) => successful)
    .with({ type: "loading" }, { type: "loadFailed" }, (other) => {
      throw new Error(`Expected a loaded page but the query was ${other.type}.`);
    })
    .exhaustive();
}

function pageOf(items: readonly string[], hasMore: boolean): Read {
  return { type: "success", page: Page.create(items, hasMore), total: TOTAL };
}

async function settle(read: RecordedRead, next: Read): Promise<void> {
  await act(async () => {
    read.settle(next);
  });
}

describe("useAsyncPagedResult", () => {
  it("should not read again when a render changes nothing", async () => {
    const { list, reads } = createLister();
    const criteria: Criteria = { typeIds: ["Unit"] };
    const { rerender } = await renderHook(useHarness, { initialProps: { criteria, list } });

    expect(reads).toHaveLength(1);
    await settle(reads[0], pageOf(["a", "b"], true));

    await rerender({ criteria: { typeIds: ["Unit"] }, list });
    await rerender({ criteria: { typeIds: ["Unit"] }, list });

    expect(reads).toHaveLength(1);
  });

  it("should read again from the first page when the criteria change, aborting the previous read", async () => {
    const { list, reads } = createLister();
    const { rerender } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], pageOf(["a", "b"], true));

    await rerender({ criteria: { typeIds: ["Spell"] }, list });

    expect(reads).toHaveLength(2);
    expect(reads[1].criteria).toEqual({ typeIds: ["Spell"] });
    expect(reads[1].offset).toBe(0);
    expect(reads[0].signal?.aborted).toBe(true);
  });

  it("should append the next page when load more succeeds", async () => {
    const { list, reads } = createLister();
    const { result } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], pageOf(["a", "b"], true));

    await act(async () => {
      result.current.loadMore();
    });

    expect(reads).toHaveLength(2);
    expect(reads[1]).toMatchObject({ limit: PAGE_SIZE, offset: 2 });
    expect(loadedPage(result.current).paging).toEqual({ type: "loadingMore" });

    await settle(reads[1], pageOf(["c", "d"], false));

    const loaded = loadedPage(result.current);
    expect(loaded.page.items).toEqual(["a", "b", "c", "d"]);
    expect(loaded.page.hasMore).toBe(false);
    expect(loaded.paging).toEqual({ type: "idle" });
  });

  it("should start one read when load more fires twice before the next render", async () => {
    const { list, reads } = createLister();
    const { result } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], pageOf(["a", "b"], true));

    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(reads).toHaveLength(2);
  });

  it("should read again when a failed load more is retried", async () => {
    const { list, reads } = createLister();
    const { result } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], pageOf(["a", "b"], true));
    await act(async () => {
      result.current.loadMore();
    });
    await settle(reads[1], { type: "listFailed" });

    expect(loadedPage(result.current).paging).toEqual({
      type: "failed",
      message: LOAD_MORE_ERROR,
    });

    await act(async () => {
      result.current.loadMore();
    });

    expect(reads).toHaveLength(3);
    expect(reads[2].offset).toBe(2);

    await settle(reads[2], pageOf(["c", "d"], false));

    expect(loadedPage(result.current).page.items).toEqual(["a", "b", "c", "d"]);
  });

  it("should ignore a load more that a refresh superseded", async () => {
    const { list, reads } = createLister();
    const { result } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], pageOf(["a", "b"], true));
    await act(async () => {
      result.current.loadMore();
    });

    await act(async () => {
      result.current.refresh();
    });

    expect(reads).toHaveLength(3);
    expect(reads[1].signal?.aborted).toBe(true);
    expect(reads[2].offset).toBe(0);
    expect(loadedPage(result.current).isRefreshing).toBe(true);

    await settle(reads[2], pageOf(["x", "y"], true));
    await settle(reads[1], pageOf(["c", "d"], false));

    const loaded = loadedPage(result.current);
    expect(loaded.page.items).toEqual(["x", "y"]);
    expect(loaded.isRefreshing).toBe(false);
    expect(loaded.paging).toEqual({ type: "idle" });
  });

  it("should start one read when the criteria change while a load more is in flight", async () => {
    const { list, reads } = createLister();
    const { rerender, result } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], pageOf(["a", "b"], true));
    await act(async () => {
      result.current.loadMore();
    });

    await rerender({ criteria: { typeIds: ["Spell"] }, list });

    expect(reads).toHaveLength(3);
    expect(reads[1].signal?.aborted).toBe(true);
    expect(reads[2]).toMatchObject({ criteria: { typeIds: ["Spell"] }, offset: 0 });
    expect(result.current.state).toEqual({ type: "loading" });
  });

  it("should read again when reload retries a failed first page", async () => {
    const { list, reads } = createLister();
    const { result } = await renderHook(useHarness, {
      initialProps: { criteria: { typeIds: ["Unit"] }, list },
    });
    await settle(reads[0], { type: "listFailed" });

    expect(result.current.state).toEqual({ type: "loadFailed" });

    await act(async () => {
      result.current.reload();
    });

    expect(reads).toHaveLength(2);
    expect(result.current.state).toEqual({ type: "loading" });

    await settle(reads[1], pageOf(["a", "b"], true));

    expect(loadedPage(result.current).page.items).toEqual(["a", "b"]);
  });
});
