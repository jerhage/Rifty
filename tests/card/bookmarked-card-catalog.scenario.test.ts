import { toggleBookmark } from "@/features/annotation/use-cases/toggle-bookmark";
import { listCardSummaries } from "@/features/card/use-cases/list-card-summaries";

import { fixedClock, subject } from "../annotation/fixtures";
import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { card, cardSet } from "./fixtures";

const MARKED_AT = "2026-09-16T10:00:00.000Z";
const UNLEASHED = cardSet("UNL", "2026-05-08T00:00:00");

describe("bookmarked card catalog scenarios", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
    store.seedSet(UNLEASHED);
  });

  afterEach(() => {
    store.close();
  });

  function seedPrinting(printingId: string, collectorNumber: string) {
    store.seedCard(
      card(printingId, UNLEASHED.code, { collectorNumber, name: `Card ${printingId}` }),
    );
  }

  function mark(printingId: string) {
    const repository = store.annotationStore.bookmarks;

    return toggleBookmark(subject("card", printingId), {
      bookmarkFinder: repository,
      bookmarkRemover: repository,
      bookmarkSaver: repository,
      clock: fixedClock(MARKED_AT),
    });
  }

  function listBookmarkedCards() {
    return listCardSummaries(
      { onlyBookmarked: true, limit: 10 },
      { cardCounter: store.cards, cardSummaryLister: store.cards },
    );
  }

  it("should page and count only the marked printings, and agree between the two", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");
    seedPrinting("spirit", "3");
    await mark("jinx");

    const result = await listBookmarkedCards();

    expect(result.page.items.map((summary) => summary.printingId)).toEqual(["jinx"]);
    expect(result.total).toBe(1);
  });

  it("should narrow the page and the count in SQL rather than after the read", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");
    await mark("jinx");
    const before = store.executedSql.length;

    await listBookmarkedCards();

    const reads = store.executedSql.slice(before);
    const joined = reads.filter((statement) => statement.includes('"bookmark"'));
    expect(joined).toHaveLength(2);
    for (const statement of joined) {
      expect(statement).toMatch(/"bookmark"\."subject_kind" = \?/);
      expect(statement).toMatch(/"bookmark"\."subject_id" = "card_printing"\."id"/);
    }
  });

  it("should answer with an empty page and no count when nothing is marked", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");

    const result = await listBookmarkedCards();

    expect(result.page.items).toEqual([]);
    expect(result.page.hasMore).toBe(false);
    expect(result.total).toBe(0);
  });

  it("should ignore a mark whose printing has left the catalog", async () => {
    seedPrinting("vi", "1");
    await mark("vi");
    await mark("withdrawn-promo");

    const result = await listBookmarkedCards();

    expect(result.page.items.map((summary) => summary.printingId)).toEqual(["vi"]);
    expect(result.total).toBe(1);
  });

  it("should drop a card out of the filter once its mark is taken off", async () => {
    seedPrinting("vi", "1");
    await expect(mark("vi")).resolves.toEqual({
      type: "bookmarked",
      bookmark: { subject: { kind: "card", id: "vi" }, createdAt: MARKED_AT },
    });
    await expect(listBookmarkedCards()).resolves.toMatchObject({ total: 1 });

    await expect(mark("vi")).resolves.toEqual({ type: "removed" });

    const result = await listBookmarkedCards();

    expect(result.page.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("should leave an unfiltered catalog untouched by a mark", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");
    await mark("jinx");

    const result = await listCardSummaries(
      { limit: 10 },
      { cardCounter: store.cards, cardSummaryLister: store.cards },
    );

    expect(result.page.items.map((summary) => summary.printingId)).toEqual(["vi", "jinx"]);
    expect(result.total).toBe(2);
  });
});
