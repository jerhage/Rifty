interface ReadOptions {
  readonly signal?: AbortSignal;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw signal.reason ?? new Error("Read was aborted.");
}

export { throwIfAborted };
export type { ReadOptions };
