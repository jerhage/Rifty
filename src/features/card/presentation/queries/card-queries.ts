import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { findCard, type FindCardCapabilities } from "@/features/card/use-cases/find-card";
import {
  listCardSummaries,
  type ListCardSummariesCapabilities,
} from "@/features/card/use-cases/list-card-summaries";
import { listCards, type ListCardsCapabilities } from "@/features/card/use-cases/list-cards";
import {
  listKeywords,
  type ListKeywordsCapabilities,
} from "@/features/card/use-cases/list-keywords";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

import { cardKeys, type CardListKeyCriteria } from "./card-keys";

const PAGE_SIZE = 30;
const LOOKUP_LIMIT = 100;
const REFERENCE_STALE_TIME_MS = 60 * 60 * 1000;

function cardDetailQuery(printingId: PrintingId, capabilities: FindCardCapabilities) {
  return queryOptions({
    queryKey: cardKeys.detail(printingId),
    queryFn: ({ signal }) => findCard(printingId, capabilities, { signal }),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

function cardsQuery(criteria: CardListKeyCriteria, capabilities: ListCardsCapabilities) {
  return infiniteQueryOptions({
    queryKey: cardKeys.list(criteria),
    queryFn: ({ pageParam, signal }) =>
      listCards({ ...criteria, limit: PAGE_SIZE, offset: pageParam }, capabilities, { signal }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.page.hasMore ? pages.length * PAGE_SIZE : undefined),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

function cardLookupQuery(printingIds: readonly PrintingId[], capabilities: ListCardsCapabilities) {
  return queryOptions({
    queryKey: cardKeys.lookup(printingIds),
    queryFn: ({ signal }) =>
      listCards({ printingIds: [...printingIds], limit: LOOKUP_LIMIT }, capabilities, { signal }),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

function cardSummariesQuery(
  criteria: CardListKeyCriteria,
  capabilities: ListCardSummariesCapabilities,
) {
  return infiniteQueryOptions({
    queryKey: cardKeys.summaryList(criteria),
    queryFn: ({ pageParam, signal }) =>
      listCardSummaries({ ...criteria, limit: PAGE_SIZE, offset: pageParam }, capabilities, {
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.page.hasMore ? pages.length * PAGE_SIZE : undefined),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

function keywordsQuery(capabilities: ListKeywordsCapabilities) {
  return queryOptions({
    queryKey: cardKeys.keywords(),
    queryFn: ({ signal }) => listKeywords(capabilities, { signal }),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

export { cardDetailQuery, cardLookupQuery, cardsQuery, cardSummariesQuery, keywordsQuery };
