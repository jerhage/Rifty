import type { SetCode } from "@/features/set/value-objects/set-code";
import type { ReadOptions } from "@/shared/read-options";
import type { CardSet } from "../card-set";
import type { SetFinder } from "../set-finder";

type FindSetResult =
  | { readonly type: "success"; readonly cardSet: CardSet }
  | { readonly type: "notFound" };

interface FindSetCapabilities {
  readonly setFinder: SetFinder;
}

async function findSet(
  code: SetCode,
  { setFinder }: FindSetCapabilities,
  options?: ReadOptions,
): Promise<FindSetResult> {
  const cardSet = await setFinder.get(code, options);
  return cardSet ? { type: "success", cardSet } : { type: "notFound" };
}

export { findSet };
export type { FindSetCapabilities, FindSetResult };
