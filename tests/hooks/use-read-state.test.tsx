import { queryOptions } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useReadState, type ReadState } from "@/hooks/use-read-state";

import { createTestWrapper } from "../test-wrapper";

type Found = { readonly type: "found"; readonly id: string } | { readonly type: "missing" };

const STORE_FAILURE = new Error("The store is unavailable.");
const FAILURE_SETTLING_MS = 250;

interface RecordedRead {
  readonly signal: AbortSignal | undefined;
  fail(error: Error): void;
  settle(found: Found): void;
}

type Finder = (signal: AbortSignal | undefined) => Promise<Found>;

function createFinder(): { readonly find: Finder; readonly reads: RecordedRead[] } {
  const reads: RecordedRead[] = [];
  const find: Finder = (signal) =>
    new Promise<Found>((resolve, reject) => {
      reads.push({ signal, fail: reject, settle: resolve });
    });

  return { find, reads };
}

function recordedRead(reads: readonly RecordedRead[], position: number): RecordedRead {
  const read = reads.at(position);

  if (read === undefined) throw new Error(`No read was started at position ${position}.`);

  return read;
}

async function renderReadState(find: Finder) {
  return await renderHook(
    () =>
      useReadState(
        queryOptions({ queryKey: ["card", "lux"], queryFn: ({ signal }) => find(signal) }),
      ),
    { wrapper: createTestWrapper() },
  );
}

type Harness = Awaited<ReturnType<typeof renderReadState>>["result"];

async function expectState(result: Harness, expected: ReadState<Found>): Promise<void> {
  await waitFor(() => expect(result.current.state).toEqual(expected));
}

async function settleRead(result: Harness, read: RecordedRead, found: Found): Promise<void> {
  read.settle(found);
  await expectState(result, found);
}

async function failRead(result: Harness, read: RecordedRead, error: Error): Promise<void> {
  read.fail(error);
  await expectState(result, { type: "failed", error });
}

describe("useReadState", () => {
  it("should be loading before the read settles", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);

    expect(reads).toHaveLength(1);
    await expectState(result, { type: "loading" });

    await settleRead(result, recordedRead(reads, 0), { type: "missing" });
  });

  it("should pass an abort signal to the read", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);

    expect(recordedRead(reads, 0).signal).toBeInstanceOf(AbortSignal);

    await settleRead(result, recordedRead(reads, 0), { type: "missing" });
  });

  it("should return the result itself rather than wrapping it when the read succeeds", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);

    await settleRead(result, recordedRead(reads, 0), { type: "found", id: "lux" });

    expect(result.current.state).toEqual({ type: "found", id: "lux" });
  });

  it("should return a business outcome flat beside loading rather than nested", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);

    await settleRead(result, recordedRead(reads, 0), { type: "missing" });

    expect(result.current.state).toEqual({ type: "missing" });
  });

  it("should be failed carrying the error when the read rejects", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);

    await failRead(result, recordedRead(reads, 0), STORE_FAILURE);

    expect(result.current.state).toEqual({ type: "failed", error: STORE_FAILURE });
  });

  it("should read again when reload is called", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);
    await settleRead(result, recordedRead(reads, 0), { type: "missing" });

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(reads).toHaveLength(2));

    await settleRead(result, recordedRead(reads, 1), { type: "found", id: "lux" });
  });

  it("should keep the last answer when a read after a successful one fails", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);
    await settleRead(result, recordedRead(reads, 0), { type: "found", id: "lux" });

    await act(async () => {
      result.current.reload();
    });
    await waitFor(() => expect(reads).toHaveLength(2));

    recordedRead(reads, 1).fail(STORE_FAILURE);

    await expect(
      waitFor(() => expect(result.current.state).toMatchObject({ type: "failed" }), {
        timeout: FAILURE_SETTLING_MS,
      }),
    ).rejects.toThrow();
    expect(result.current.state).toEqual({ type: "found", id: "lux" });
  });

  it("should read again when reload retries a failed read", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderReadState(find);
    await failRead(result, recordedRead(reads, 0), STORE_FAILURE);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(reads).toHaveLength(2));

    await settleRead(result, recordedRead(reads, 1), { type: "found", id: "lux" });
  });
});
