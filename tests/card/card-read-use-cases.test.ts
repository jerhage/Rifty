import type { CardCounter } from "@/features/card/card-counter";
import type { CardFinder } from "@/features/card/card-finder";
import type { CardLister } from "@/features/card/card-lister";
import type { CardSummaryLister } from "@/features/card/card-summary-lister";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";
import { findCard } from "@/features/card/use-cases/find-card";
import { listCardSummaries } from "@/features/card/use-cases/list-card-summaries";
import { listCards } from "@/features/card/use-cases/list-cards";
import { listKeywords } from "@/features/card/use-cases/list-keywords";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";

const STORE_FAILURE = new Error("The store is unavailable.");

const cardCounter: CardCounter = { count: () => Promise.resolve(0) };
const failingCardFinder: CardFinder = { get: () => Promise.reject(STORE_FAILURE) };
const failingCardLister: CardLister = { getPage: () => Promise.reject(STORE_FAILURE) };
const failingCardSummaryLister: CardSummaryLister = {
  getSummaryPage: () => Promise.reject(STORE_FAILURE),
};
const failingKeywordLister: KeywordLister = { getAll: () => Promise.reject(STORE_FAILURE) };

describe("card read use cases", () => {
  it("should reject rather than answer when finding a card fails", async () => {
    await expect(
      findCard(printingIdSchema.parse("vi"), { cardFinder: failingCardFinder }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when paging cards fails", async () => {
    await expect(listCards(undefined, { cardCounter, cardLister: failingCardLister })).rejects.toBe(
      STORE_FAILURE,
    );
  });

  it("should reject rather than answer when paging card summaries fails", async () => {
    await expect(
      listCardSummaries(undefined, {
        cardCounter,
        cardSummaryLister: failingCardSummaryLister,
      }),
    ).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when listing keywords fails", async () => {
    await expect(listKeywords({ keywordLister: failingKeywordLister })).rejects.toBe(STORE_FAILURE);
  });
});
