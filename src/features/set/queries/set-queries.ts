import { queryOptions } from "@tanstack/react-query";

import { listSets, type ListSetsCapabilities } from "@/features/set/use-cases/list-sets";

import { setKeys } from "./set-keys";

const REFERENCE_STALE_TIME_MS = 60 * 60 * 1000;

function listCardSetsQuery(capabilities: ListSetsCapabilities) {
  return queryOptions({
    queryKey: setKeys.list(),
    queryFn: ({ signal }) => listSets(capabilities, { signal }),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

export { listCardSetsQuery };
