import { listBookmarks } from "@/features/annotation/use-cases/list-bookmarks";
import { listNotes } from "@/features/annotation/use-cases/list-notes";
import { toggleBookmark } from "@/features/annotation/use-cases/toggle-bookmark";
import { writeNote } from "@/features/annotation/use-cases/write-note";
import { parseDeck } from "@/features/deck/deck/deck";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { fixedClock, sequentialIds, subject } from "./fixtures";

const RULE = subject("coreRule", "103.2");
const CARD = subject("card", "Ember Adept");
const DECK = subject("deck", "ember-tempo");

describe("annotation storage scenarios", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  function bookmarkCapabilities(...instants: readonly string[]) {
    const repository = store.annotationStore.bookmarks;

    return {
      bookmarkFinder: repository,
      bookmarkRemover: repository,
      bookmarkSaver: repository,
      clock: fixedClock(...instants),
    };
  }

  function noteCapabilities(...instants: readonly string[]) {
    const repository = store.annotationStore.notes;

    return {
      clock: fixedClock(...instants),
      idGenerator: sequentialIds(),
      noteFinder: repository,
      noteSaver: repository,
    };
  }

  it("should read a bookmark back with the subject and the instant the fake clock gave it", async () => {
    await expect(
      toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:00:00.000Z")),
    ).resolves.toEqual({
      type: "bookmarked",
      bookmark: { subject: RULE, createdAt: "2026-09-16T10:00:00.000Z" },
    });

    await expect(
      listBookmarks({ type: "all" }, { bookmarkLister: store.annotationStore.bookmarks }),
    ).resolves.toEqual({
      type: "success",
      bookmarks: [{ subject: RULE, createdAt: "2026-09-16T10:00:00.000Z" }],
    });
  });

  it("should narrow a bookmark read to one kind in SQL rather than after the read", async () => {
    await toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:00:00.000Z"));
    await toggleBookmark(CARD, bookmarkCapabilities("2026-09-16T10:01:00.000Z"));
    await toggleBookmark(DECK, bookmarkCapabilities("2026-09-16T10:02:00.000Z"));

    await expect(
      listBookmarks(
        { type: "ofKind", kind: "card" },
        { bookmarkLister: store.annotationStore.bookmarks },
      ),
    ).resolves.toEqual({
      type: "success",
      bookmarks: [{ subject: CARD, createdAt: "2026-09-16T10:01:00.000Z" }],
    });
    expect(store.executedSql.at(-1)).toMatch(/where .*"subject_kind" = \?/);
  });

  it("should order bookmarks with the newest mark first", async () => {
    await toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:00:00.000Z"));
    await toggleBookmark(CARD, bookmarkCapabilities("2026-09-16T10:01:00.000Z"));

    const result = await listBookmarks(
      { type: "all" },
      { bookmarkLister: store.annotationStore.bookmarks },
    );

    expect(result.bookmarks.map((bookmark) => bookmark.subject)).toEqual([CARD, RULE]);
  });

  it("should keep one row when the same subject is marked twice", async () => {
    await store.annotationStore.bookmarks.save({
      subject: RULE,
      createdAt: "2026-09-16T10:00:00.000Z",
    });
    await store.annotationStore.bookmarks.save({
      subject: RULE,
      createdAt: "2026-09-16T11:00:00.000Z",
    });

    await expect(
      listBookmarks({ type: "all" }, { bookmarkLister: store.annotationStore.bookmarks }),
    ).resolves.toEqual({
      type: "success",
      bookmarks: [{ subject: RULE, createdAt: "2026-09-16T10:00:00.000Z" }],
    });
  });

  it("should report each direction of the toggle in one call", async () => {
    await expect(
      toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:00:00.000Z")),
    ).resolves.toEqual({
      type: "bookmarked",
      bookmark: { subject: RULE, createdAt: "2026-09-16T10:00:00.000Z" },
    });
    await expect(
      toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:01:00.000Z")),
    ).resolves.toEqual({ type: "removed" });
    await expect(
      listBookmarks({ type: "all" }, { bookmarkLister: store.annotationStore.bookmarks }),
    ).resolves.toEqual({ type: "success", bookmarks: [] });
  });

  it("should leave a note on the same subject standing when its bookmark is removed", async () => {
    await toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:00:00.000Z"));
    await writeNote(
      { id: null, subject: RULE, title: "Timing", body: "Check this before combat." },
      noteCapabilities("2026-09-16T10:01:00.000Z"),
    );

    await expect(
      toggleBookmark(RULE, bookmarkCapabilities("2026-09-16T10:02:00.000Z")),
    ).resolves.toEqual({ type: "removed" });

    const remaining = await listNotes(
      { type: "onSubject", subject: RULE },
      { noteLister: store.annotationStore.notes },
    );

    expect(remaining.notes).toEqual([
      {
        id: "note-1",
        subject: RULE,
        title: "Timing",
        body: "Check this before combat.",
        createdAt: "2026-09-16T10:01:00.000Z",
        updatedAt: "2026-09-16T10:01:00.000Z",
      },
    ]);
  });

  it("should collect many notes on one subject, newest writing first", async () => {
    const capabilities = noteCapabilities(
      "2026-09-16T10:00:00.000Z",
      "2026-09-16T10:01:00.000Z",
      "2026-09-16T10:02:00.000Z",
    );
    await writeNote({ id: null, subject: RULE, title: "", body: "First" }, capabilities);
    await writeNote({ id: null, subject: RULE, title: "", body: "Second" }, capabilities);
    await writeNote({ id: null, subject: RULE, title: "", body: "Third" }, capabilities);

    const result = await listNotes(
      { type: "onSubject", subject: RULE },
      { noteLister: store.annotationStore.notes },
    );

    expect(result.notes.map((note) => [note.id, note.body])).toEqual([
      ["note-3", "Third"],
      ["note-2", "Second"],
      ["note-1", "First"],
    ]);
    expect(store.executedSql.at(-1)).toMatch(/where .*"subject_kind" = \?/);
  });

  it("should return a note with no subject from the standalone scope and never from a subject scope", async () => {
    await writeNote(
      { id: null, subject: null, title: "Scratchpad", body: "Match one: mulliganed two." },
      noteCapabilities("2026-09-16T10:00:00.000Z"),
    );

    await expect(
      listNotes({ type: "standalone" }, { noteLister: store.annotationStore.notes }),
    ).resolves.toEqual({
      type: "success",
      notes: [
        {
          id: "note-1",
          subject: null,
          title: "Scratchpad",
          body: "Match one: mulliganed two.",
          createdAt: "2026-09-16T10:00:00.000Z",
          updatedAt: "2026-09-16T10:00:00.000Z",
        },
      ],
    });
    await expect(
      listNotes({ type: "onSubject", subject: RULE }, { noteLister: store.annotationStore.notes }),
    ).resolves.toEqual({ type: "success", notes: [] });
    expect(store.executedSql.at(-2)).toMatch(/where .*"subject_kind" is null/);
  });

  it("should rewrite a note in place, changing its body and the instant it was last written", async () => {
    const capabilities = noteCapabilities("2026-09-16T10:00:00.000Z", "2026-09-16T11:00:00.000Z");
    await writeNote({ id: null, subject: CARD, title: "Play", body: "Hold it." }, capabilities);

    await expect(
      writeNote(
        { id: "note-1", subject: CARD, title: "Play", body: "Lead with it." },
        capabilities,
      ),
    ).resolves.toEqual({
      type: "updated",
      note: {
        id: "note-1",
        subject: CARD,
        title: "Play",
        body: "Lead with it.",
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
      },
    });

    const result = await listNotes(
      { type: "onSubject", subject: CARD },
      { noteLister: store.annotationStore.notes },
    );

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]?.body).toBe("Lead with it.");
    expect(result.notes[0]?.createdAt).toBe("2026-09-16T10:00:00.000Z");
    expect(result.notes[0]?.updatedAt).toBe("2026-09-16T11:00:00.000Z");
  });

  it("should still read a bookmark and a note back after their subject is gone", async () => {
    store.seedDeck(
      parseDeck({
        id: "ember-tempo",
        name: "Ember Tempo",
        notes: "",
        createdAt: "2026-09-16T09:00:00.000Z",
        updatedAt: "2026-09-16T09:00:00.000Z",
        chosenChampionCardId: null,
        entries: [],
      }),
    );
    await toggleBookmark(DECK, bookmarkCapabilities("2026-09-16T10:00:00.000Z"));
    await writeNote(
      { id: null, subject: DECK, title: "", body: "Swap the runes." },
      noteCapabilities("2026-09-16T10:01:00.000Z"),
    );

    await store.deckStore.repository.remove("ember-tempo");

    await expect(
      listBookmarks(
        { type: "ofKind", kind: "deck" },
        { bookmarkLister: store.annotationStore.bookmarks },
      ),
    ).resolves.toEqual({
      type: "success",
      bookmarks: [{ subject: DECK, createdAt: "2026-09-16T10:00:00.000Z" }],
    });
    const remaining = await listNotes(
      { type: "onSubject", subject: DECK },
      { noteLister: store.annotationStore.notes },
    );
    expect(remaining.notes.map((note) => note.body)).toEqual(["Swap the runes."]);
  });
});
