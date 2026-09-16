import { queryOptions } from "@tanstack/react-query";

import {
  findCoreRulesEdition,
  type FindCoreRulesEditionCapabilities,
} from "@/features/rules/use-cases/find-core-rules-edition";
import {
  listCoreRules,
  type ListCoreRulesCapabilities,
} from "@/features/rules/use-cases/list-core-rules";

import { coreRulesKeys } from "./core-rules-keys";

const REFERENCE_STALE_TIME_MS = 60 * 60 * 1000;

function listCoreRulesQuery(capabilities: ListCoreRulesCapabilities) {
  return queryOptions({
    queryKey: coreRulesKeys.document(),
    queryFn: ({ signal }) => listCoreRules(capabilities, { signal }),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

function getCoreRulesEditionQuery(capabilities: FindCoreRulesEditionCapabilities) {
  return queryOptions({
    queryKey: coreRulesKeys.edition(),
    queryFn: ({ signal }) => findCoreRulesEdition(capabilities, { signal }),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

export { getCoreRulesEditionQuery, listCoreRulesQuery };
