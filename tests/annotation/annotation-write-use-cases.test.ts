import type { BookmarkFinder } from "@/features/annotation/bookmark-finder";
import type { BookmarkRemover } from "@/features/annotation/bookmark-remover";
import type { BookmarkSaver } from "@/features/annotation/bookmark-saver";
import type { Note } from "@/features/annotation/note";
import type { NoteFinder } from "@/features/annotation/note-finder";
import type { NoteRemover } from "@/features/annotation/note-remover";
import type { NoteSaver } from "@/features/annotation/note-saver";
import { deleteNote } from "@/features/annotation/use-cases/delete-note";
import { findBookmark } from "@/features/annotation/use-cases/find-bookmark";
import { toggleBookmark } from "@/features/annotation/use-cases/toggle-bookmark";
import { writeNote } from "@/features/annotation/use-cases/write-note";

import { fixedClock, sequentialIds, subject } from "./fixtures";

const RULE = subject("coreRule", "103.2");
const STORE_FAILURE = new Error("The store is unavailable.");
const clock = fixedClock("2026-09-16T10:00:00.000Z");
const idGenerator = sequentialIds();
const missingFinder: NoteFinder = { get: () => Promise.resolve(null) };
const failingSaver: NoteSaver = { save: () => Promise.reject(STORE_FAILURE) };
const unmarkedFinder: BookmarkFinder = { get: () => Promise.resolve(null) };
const failingRemover: BookmarkRemover = { remove: () => Promise.reject(STORE_FAILURE) };

function recordingNoteSaver(): { readonly saver: NoteSaver; readonly written: Note[] } {
  const written: Note[] = [];

  return {
    saver: {
      save: (note: Note) => {
        written.push(note);
        return Promise.resolve();
      },
    },
    written,
  };
}

describe("annotation write use cases", () => {
  it("should report a missing body rather than writing an empty note", async () => {
    await expect(
      writeNote(
        { id: null, subject: RULE, title: "Timing", body: "   " },
        { clock, idGenerator, noteFinder: missingFinder, noteSaver: failingSaver },
      ),
    ).resolves.toEqual({ type: "bodyMissing" });
  });

  it("should report a note that is no longer there rather than creating one under its id", async () => {
    await expect(
      writeNote(
        { id: "note-9", subject: RULE, title: "", body: "Kept." },
        { clock, idGenerator, noteFinder: missingFinder, noteSaver: failingSaver },
      ),
    ).resolves.toEqual({ type: "notFound" });
  });

  it("should take a new note's id and both instants from the injected ports", async () => {
    const { saver, written } = recordingNoteSaver();

    await expect(
      writeNote(
        { id: null, subject: null, title: "  Scratchpad  ", body: "  Two runes short.  " },
        {
          clock: fixedClock("2026-09-16T12:00:00.000Z"),
          idGenerator: sequentialIds("written"),
          noteFinder: missingFinder,
          noteSaver: saver,
        },
      ),
    ).resolves.toEqual({
      type: "created",
      note: {
        id: "written-1",
        subject: null,
        title: "Scratchpad",
        body: "Two runes short.",
        createdAt: "2026-09-16T12:00:00.000Z",
        updatedAt: "2026-09-16T12:00:00.000Z",
      },
    });
    expect(written).toHaveLength(1);
  });

  it("should mark an unmarked subject without asking the remover", async () => {
    const saved: unknown[] = [];
    const saver: BookmarkSaver = {
      save: (bookmark) => {
        saved.push(bookmark);
        return Promise.resolve();
      },
    };

    await expect(
      toggleBookmark(RULE, {
        bookmarkFinder: unmarkedFinder,
        bookmarkRemover: failingRemover,
        bookmarkSaver: saver,
        clock: fixedClock("2026-09-16T13:00:00.000Z"),
      }),
    ).resolves.toEqual({
      type: "bookmarked",
      bookmark: { subject: RULE, createdAt: "2026-09-16T13:00:00.000Z" },
    });
    expect(saved).toEqual([{ subject: RULE, createdAt: "2026-09-16T13:00:00.000Z" }]);
  });

  it("should answer that an unmarked subject is not bookmarked", async () => {
    await expect(findBookmark(RULE, { bookmarkFinder: unmarkedFinder })).resolves.toEqual({
      type: "notBookmarked",
    });
  });

  it("should treat deleting a note that is already gone as a success", async () => {
    const remover: NoteRemover = { remove: () => Promise.resolve() };

    await expect(deleteNote("note-9", { noteRemover: remover })).resolves.toEqual({
      type: "success",
    });
  });
});
