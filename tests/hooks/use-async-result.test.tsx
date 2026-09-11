import { act, renderHook } from "@testing-library/react-native";
import { useCallback } from "react";

import { type AsyncRun, useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

type Found = { readonly type: "found"; readonly id: string } | { readonly type: "missing" };

interface RecordedRead {
  readonly id: string;
  readonly signal: AbortSignal | undefined;
  settle(found: Found): void;
}

type Finder = (id: string, options: ReadOptions) => Promise<Found>;

interface HarnessProps {
  readonly find: Finder;
  readonly id: string;
}

function createFinder(): { readonly find: Finder; readonly reads: RecordedRead[] } {
  const reads: RecordedRead[] = [];
  const find: Finder = (id, options) =>
    new Promise<Found>((resolve) => {
      reads.push({ id, signal: options.signal, settle: resolve });
    });

  return { find, reads };
}

function useHarness({ find, id }: HarnessProps) {
  const run = useCallback<AsyncRun<Found>>((options) => find(id, options), [find, id]);

  return useAsyncResult(run);
}

async function settle(read: RecordedRead, found: Found): Promise<void> {
  await act(async () => {
    read.settle(found);
  });
}

describe("useAsyncResult", () => {
  it("should not read again when a render changes nothing", async () => {
    const { find, reads } = createFinder();
    const { rerender } = await renderHook(useHarness, { initialProps: { find, id: "lux" } });
    await settle(reads[0], { type: "found", id: "lux" });

    await rerender({ find, id: "lux" });
    await rerender({ find, id: "lux" });

    expect(reads).toHaveLength(1);
  });

  it("should read again when the requested identity changes", async () => {
    const { find, reads } = createFinder();
    const { rerender, result } = await renderHook(useHarness, {
      initialProps: { find, id: "lux" },
    });
    await settle(reads[0], { type: "found", id: "lux" });

    await rerender({ find, id: "sett" });

    expect(reads).toHaveLength(2);
    expect(reads[1].id).toBe("sett");
    expect(reads[0].signal?.aborted).toBe(true);
    expect(result.current.result).toEqual({ type: "loading" });
  });

  it("should read again when reload is called", async () => {
    const { find, reads } = createFinder();
    const { result } = await renderHook(useHarness, { initialProps: { find, id: "lux" } });
    await settle(reads[0], { type: "missing" });

    await act(async () => {
      result.current.reload();
    });

    expect(reads).toHaveLength(2);

    await settle(reads[1], { type: "found", id: "lux" });

    expect(result.current.result).toEqual({ type: "found", id: "lux" });
  });
});
