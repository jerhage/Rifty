import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useWriteState, type WriteState } from "@/hooks/use-write-state";

import { createTestWrapper } from "../test-wrapper";

type Saved = { readonly type: "success"; readonly id: string } | { readonly type: "nameTaken" };

const STORE_FAILURE = new Error("The store is unavailable.");

interface RecordedWrite {
  readonly name: string;
  fail(error: Error): void;
  settle(saved: Saved): void;
}

type Saver = (name: string) => Promise<Saved>;

function createSaver(): { readonly save: Saver; readonly writes: RecordedWrite[] } {
  const writes: RecordedWrite[] = [];
  const save: Saver = (name) =>
    new Promise<Saved>((resolve, reject) => {
      writes.push({ name, fail: reject, settle: resolve });
    });

  return { save, writes };
}

function recordedWrite(writes: readonly RecordedWrite[], position: number): RecordedWrite {
  const write = writes.at(position);

  if (write === undefined) throw new Error(`No write was submitted at position ${position}.`);

  return write;
}

async function renderWriteState(save: Saver) {
  return await renderHook(() => useWriteState({ mutationFn: save }), {
    wrapper: createTestWrapper(),
  });
}

type Harness = Awaited<ReturnType<typeof renderWriteState>>["result"];

async function expectState(result: Harness, expected: WriteState<Saved>): Promise<void> {
  await waitFor(() => expect(result.current.state).toEqual(expected));
}

async function submit(result: Harness, name: string): Promise<void> {
  await act(async () => {
    result.current.submit(name);
  });
}

async function settleWrite(result: Harness, write: RecordedWrite, saved: Saved): Promise<void> {
  write.settle(saved);
  await expectState(result, saved);
}

async function failWrite(result: Harness, write: RecordedWrite, error: Error): Promise<void> {
  write.fail(error);
  await expectState(result, { type: "failed", error });
}

describe("useWriteState", () => {
  it("should be idle before the write is submitted", async () => {
    const { save, writes } = createSaver();
    const { result } = await renderWriteState(save);

    expect(writes).toHaveLength(0);
    await expectState(result, { type: "idle" });
  });

  it("should be saving while the write is in flight", async () => {
    const { save, writes } = createSaver();
    const { result } = await renderWriteState(save);

    await submit(result, "Lux Control");

    expect(writes).toHaveLength(1);
    expect(recordedWrite(writes, 0).name).toBe("Lux Control");
    await expectState(result, { type: "saving" });

    await settleWrite(result, recordedWrite(writes, 0), { type: "nameTaken" });
  });

  it("should return the result itself rather than wrapping it when the write succeeds", async () => {
    const { save, writes } = createSaver();
    const { result } = await renderWriteState(save);
    await submit(result, "Lux Control");

    await settleWrite(result, recordedWrite(writes, 0), { type: "success", id: "deck-1" });

    expect(result.current.state).toEqual({ type: "success", id: "deck-1" });
  });

  it("should return a business outcome flat beside saving rather than nested", async () => {
    const { save, writes } = createSaver();
    const { result } = await renderWriteState(save);
    await submit(result, "Lux Control");

    await settleWrite(result, recordedWrite(writes, 0), { type: "nameTaken" });

    expect(result.current.state).toEqual({ type: "nameTaken" });
  });

  it("should stay on the successful result rather than returning to idle", async () => {
    const { save, writes } = createSaver();
    const { rerender, result } = await renderWriteState(save);
    await submit(result, "Lux Control");
    await settleWrite(result, recordedWrite(writes, 0), { type: "success", id: "deck-1" });

    await rerender(undefined);

    await expectState(result, { type: "success", id: "deck-1" });
  });

  it("should be failed carrying the error when the write rejects", async () => {
    const { save, writes } = createSaver();
    const { result } = await renderWriteState(save);
    await submit(result, "Lux Control");

    await failWrite(result, recordedWrite(writes, 0), STORE_FAILURE);

    expect(result.current.state).toEqual({ type: "failed", error: STORE_FAILURE });
  });

  it("should return to idle when reset is called after a failure", async () => {
    const { save, writes } = createSaver();
    const { result } = await renderWriteState(save);
    await submit(result, "Lux Control");
    await failWrite(result, recordedWrite(writes, 0), STORE_FAILURE);

    await act(async () => {
      result.current.reset();
    });

    await expectState(result, { type: "idle" });
  });
});
