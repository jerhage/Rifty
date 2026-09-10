import type { CardSet } from "../card-set";
import type { SetLister } from "../set-lister";

type ListSetsResult =
  | { readonly type: "success"; readonly cardSets: readonly CardSet[] }
  | { readonly type: "listFailed" };

interface ListSetsCapabilities {
  readonly setLister: SetLister;
}

async function listSets({ setLister }: ListSetsCapabilities): Promise<ListSetsResult> {
  try {
    return { type: "success", cardSets: await setLister.getAll() };
  } catch {
    return { type: "listFailed" };
  }
}

export { listSets };
export type { ListSetsCapabilities, ListSetsResult };
