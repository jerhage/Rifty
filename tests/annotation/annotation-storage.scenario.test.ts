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

  it("should leave a card's notes standing when its bookmark is removed", async () => {
    await toggleBookmark(CARD, bookmarkCapabilities("2026-09-16T10:00:00.000Z"));
    await writeNote(
      { id: null, subject: CARD, title: "", body: "Hold it for the second turn." },
      noteCapabilities("2026-09-16T10:01:00.000Z"),
    );

    await expect(
      toggleBookmark(CARD, bookmarkCapabilities("2026-09-16T10:02:00.000Z")),
    ).resolves.toEqual({ type: "removed" });

    const remaining = await listNotes(
      { type: "onSubject", subject: CARD },
      { noteLister: store.annotationStore.notes },
    );

    expect(remaining.notes.map((note) => note.body)).toEqual(["Hold it for the second turn."]);
    await expect(
      listBookmarks(
        { type: "ofKind", kind: "card" },
        { bookmarkLister: store.annotationStore.bookmarks },
      ),
    ).resolves.toEqual({ type: "success", bookmarks: [] });
  });

  it("should keep a card's notes and a rule's notes out of each other's reads", async () => {
    const capabilities = noteCapabilities(
      "2026-09-16T10:00:00.000Z",
      "2026-09-16T10:01:00.000Z",
      "2026-09-16T10:02:00.000Z",
    );
    await writeNote({ id: null, subject: CARD, title: "", body: "On the card" }, capabilities);
    await writeNote({ id: null, subject: RULE, title: "", body: "On the rule" }, capabilities);
    await writeNote({ id: null, subject: null, title: "", body: "On nothing" }, capabilities);

    const onCard = await listNotes(
      { type: "onSubject", subject: CARD },
      { noteLister: store.annotationStore.notes },
    );
    const onRule = await listNotes(
      { type: "onSubject", subject: RULE },
      { noteLister: store.annotationStore.notes },
    );
    const everyNote = await listNotes({ type: "all" }, { noteLister: store.annotationStore.notes });

    expect(onCard.notes.map((note) => note.body)).toEqual(["On the card"]);
    expect(onRule.notes.map((note) => note.body)).toEqual(["On the rule"]);
    expect(
      everyNote.notes.filter((note) => note.subject === null).map((note) => note.body),
    ).toEqual(["On nothing"]);
  });

  it("should read every note of one kind in one query, and none of another kind", async () => {
    const capabilities = noteCapabilities(
      "2026-09-16T10:00:00.000Z",
      "2026-09-16T10:01:00.000Z",
      "2026-09-16T10:02:00.000Z",
    );
    const OTHER_RULE = subject("coreRule", "204.1");
    await writeNote({ id: null, subject: RULE, title: "", body: "On one rule" }, capabilities);
    await writeNote(
      { id: null, subject: OTHER_RULE, title: "", body: "On another rule" },
      capabilities,
    );
    await writeNote({ id: null, subject: CARD, title: "", body: "On the card" }, capabilities);

    const ofKind = await listNotes(
      { type: "ofKind", kind: "coreRule" },
      { noteLister: store.annotationStore.notes },
    );

    expect(ofKind.notes.map((note) => note.body)).toEqual(["On another rule", "On one rule"]);
    expect(store.executedSql.at(-1)).toMatch(/where .*"subject_kind" = \?/);
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

  it("should return a note with no subject from every read and never from a subject scope", async () => {
    await writeNote(
      { id: null, subject: null, title: "Scratchpad", body: "Match one: mulliganed two." },
      noteCapabilities("2026-09-16T10:00:00.000Z"),
    );

    await expect(
      listNotes({ type: "all" }, { noteLister: store.annotationStore.notes }),
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
    const tempo = parseDeck({
      id: "ember-tempo",
      name: "Ember Tempo",
      createdAt: "2026-09-16T09:00:00.000Z",
      updatedAt: "2026-09-16T09:00:00.000Z",
      chosenChampionCardId: null,
      entries: [],
    });
    store.seedDeck(tempo);
    await toggleBookmark(DECK, bookmarkCapabilities("2026-09-16T10:00:00.000Z"));
    await writeNote(
      { id: null, subject: DECK, title: "", body: "Swap the runes." },
      noteCapabilities("2026-09-16T10:01:00.000Z"),
    );

    await store.deckStore.repository.remove(tempo.id);

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
