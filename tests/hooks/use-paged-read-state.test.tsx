import { infiniteQueryOptions } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { match } from "ts-pattern";

import {
  usePagedReadState,
  type PagedResult,
  type PagingState,
} from "@/hooks/use-paged-read-state";
import { Page } from "@/shared/page";

import { createTestWrapper } from "../test-wrapper";

const PAGE_SIZE = 2;
const TOTAL = 4;
const LOAD_MORE_ERROR = "Could not load more.";
const STORE_FAILURE = new Error("The store is unavailable.");

interface RecordedRead {
  readonly offset: number;
  readonly signal: AbortSignal | undefined;
  fail(error: Error): void;
  settle(result: PagedResult<string>): void;
}

type Lister = (offset: number, signal: AbortSignal | undefined) => Promise<PagedResult<string>>;

function createLister(): { readonly list: Lister; readonly reads: RecordedRead[] } {
  const reads: RecordedRead[] = [];
  const list: Lister = (offset, signal) =>
    new Promise<PagedResult<string>>((resolve, reject) => {
      reads.push({ offset, signal, fail: reject, settle: resolve });
    });

  return { list, reads };
}

async function renderPagedReadState(list: Lister) {
  return await renderHook(
    () =>
      usePagedReadState(
        infiniteQueryOptions({
          queryKey: ["cards"],
          queryFn: ({ pageParam, signal }) => list(pageParam, signal),
          initialPageParam: 0,
          getNextPageParam: (last, pages) =>
            last.page.hasMore ? pages.length * PAGE_SIZE : undefined,
        }),
        { loadMoreErrorMessage: LOAD_MORE_ERROR },
      ),
    { wrapper: createTestWrapper() },
  );
}

type Harness = Awaited<ReturnType<typeof renderPagedReadState>>["result"];

function loaded(result: Harness) {
  return match(result.current.state)
    .with({ type: "success" }, (successful) => successful)
    .with({ type: "loading" }, { type: "failed" }, (other) => {
      throw new Error(`Expected a loaded page but the read was ${other.type}.`);
    })
    .exhaustive();
}

function pageOf(items: readonly string[], hasMore: boolean): PagedResult<string> {
  return { type: "success", page: Page.create(items, hasMore), total: TOTAL };
}

async function expectPaging(result: Harness, paging: PagingState): Promise<void> {
  await waitFor(() => expect(loaded(result).paging).toEqual(paging));
}

async function settlePage(
  result: Harness,
  read: RecordedRead,
  page: PagedResult<string>,
  expectedItems: readonly string[],
): Promise<void> {
  read.settle(page);
  await waitFor(() => expect(loaded(result).items).toEqual(expectedItems));
}

describe("usePagedReadState", () => {
  it("should be loading before the first page settles", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);

    expect(reads).toHaveLength(1);
    expect(reads[0].offset).toBe(0);
    await waitFor(() => expect(result.current.state).toEqual({ type: "loading" }));

    await settlePage(result, reads[0], pageOf(["a", "b"], false), ["a", "b"]);
  });

  it("should pass an abort signal to the read", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);

    expect(reads[0].signal).toBeInstanceOf(AbortSignal);

    await settlePage(result, reads[0], pageOf(["a", "b"], false), ["a", "b"]);
  });

  it("should expose flattened items, hasMore and total when the first page arrives", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);

    await settlePage(result, reads[0], pageOf(["a", "b"], true), ["a", "b"]);

    expect(loaded(result)).toEqual({
      type: "success",
      hasMore: true,
      isRefreshing: false,
      items: ["a", "b"],
      paging: { type: "idle" },
      total: TOTAL,
    });
  });

  it("should append the next page when load more succeeds", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    await settlePage(result, reads[0], pageOf(["a", "b"], true), ["a", "b"]);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads[1].offset).toBe(PAGE_SIZE);
    await expectPaging(result, { type: "loadingMore" });

    await settlePage(result, reads[1], pageOf(["c", "d"], false), ["a", "b", "c", "d"]);

    expect(loaded(result).hasMore).toBe(false);
    await expectPaging(result, { type: "idle" });
  });

  it("should not read again when load more is called with no further page", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    await settlePage(result, reads[0], pageOf(["a", "b"], false), ["a", "b"]);

    await act(async () => {
      result.current.loadMore();
    });

    expect(reads).toHaveLength(1);
  });

  it("should start one read when load more fires twice before the next render", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    await settlePage(result, reads[0], pageOf(["a", "b"], true), ["a", "b"]);

    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(reads).toHaveLength(2);

    await settlePage(result, reads[1], pageOf(["c", "d"], false), ["a", "b", "c", "d"]);
  });

  it("should report a failed load more on paging while keeping the loaded items", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    await settlePage(result, reads[0], pageOf(["a", "b"], true), ["a", "b"]);
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(reads).toHaveLength(2));

    reads[1].fail(STORE_FAILURE);

    await expectPaging(result, { type: "failed", message: LOAD_MORE_ERROR });
    expect(loaded(result).items).toEqual(["a", "b"]);
  });

  it("should read again when a failed load more is retried", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    await settlePage(result, reads[0], pageOf(["a", "b"], true), ["a", "b"]);
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(reads).toHaveLength(2));
    reads[1].fail(STORE_FAILURE);
    await expectPaging(result, { type: "failed", message: LOAD_MORE_ERROR });

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(reads).toHaveLength(3));
    expect(reads[2].offset).toBe(PAGE_SIZE);

    await settlePage(result, reads[2], pageOf(["c", "d"], false), ["a", "b", "c", "d"]);

    await expectPaging(result, { type: "idle" });
  });

  it("should be refreshing while a refresh is in flight and keep the items until it settles", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    await settlePage(result, reads[0], pageOf(["a", "b"], true), ["a", "b"]);

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads[1].offset).toBe(0);
    await waitFor(() => expect(loaded(result).isRefreshing).toBe(true));
    expect(loaded(result).items).toEqual(["a", "b"]);

    await settlePage(result, reads[1], pageOf(["x", "y"], true), ["x", "y"]);

    expect(loaded(result).isRefreshing).toBe(false);
  });

  it("should be failed carrying the error when the first page rejects", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);

    reads[0].fail(STORE_FAILURE);

    await waitFor(() =>
      expect(result.current.state).toEqual({ type: "failed", error: STORE_FAILURE }),
    );
  });

  it("should read again from the first page when reload retries a failed read", async () => {
    const { list, reads } = createLister();
    const { result } = await renderPagedReadState(list);
    reads[0].fail(STORE_FAILURE);
    await waitFor(() => expect(result.current.state).toMatchObject({ type: "failed" }));

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads[1].offset).toBe(0);

    await settlePage(result, reads[1], pageOf(["a", "b"], true), ["a", "b"]);
  });
});
