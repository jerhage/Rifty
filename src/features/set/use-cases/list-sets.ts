import type { ReadOptions } from "@/shared/read-options";
import type { CardSet } from "../card-set";
import type { SetLister } from "../set-lister";

type ListSetsResult = {
  readonly type: "success";
  readonly cardSets: readonly CardSet[];
};

interface ListSetsCapabilities {
  readonly setLister: SetLister;
}

async function listSets(
  { setLister }: ListSetsCapabilities,
  options?: ReadOptions,
): Promise<ListSetsResult> {
  return { type: "success", cardSets: await setLister.getAll(options) };
}

export { listSets };
export type { ListSetsCapabilities, ListSetsResult };
