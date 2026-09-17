import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import type { Note } from "@/features/annotation/note";
import type { NoteListScope } from "@/features/annotation/note-list-scope";
import type { NoteManager } from "@/features/annotation/note-manager";
import {
  annotationSubjectSchema,
  type AnnotationSubject,
  type AnnotationSubjectKind,
} from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummariesByPrintingIdsFinder } from "@/features/card/card-summaries-by-printing-ids-finder";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesByNumbersFinder } from "@/features/rules/core-rules-by-numbers-finder";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

const MARKED_AT = "2026-09-16T10:00:00.000Z";

function subject(kind: AnnotationSubjectKind, id: string): AnnotationSubject {
  return annotationSubjectSchema.parse({ kind, id });
}

/** Hands out the given instants in order, repeating the last one once they run out. */
function fixedClock(...instants: readonly string[]): Clock {
  let index = 0;

  return {
    now: () => instants[Math.min(index++, instants.length - 1)] ?? "2026-09-16T10:00:00.000Z",
  };
}

function sequentialIds(prefix = "note"): IdGenerator {
  let index = 0;

  return { next: () => `${prefix}-${++index}` };
}

interface NoteStore {
  readonly manager: NoteManager;
  notes(): readonly Note[];
  removals(): number;
  scopes(): readonly NoteListScope[];
}

function sameSubject(one: Note["subject"], other: Note["subject"]): boolean {
  if (one === null || other === null) return one === other;

  return one.kind === other.kind && one.id === other.id;
}

function inScope(note: Note, scope: NoteListScope): boolean {
  return match(scope)
    .with({ type: "all" }, () => true)
    .with({ type: "ofKind" }, ({ kind }) => note.subject?.kind === kind)
    .with({ type: "onSubject" }, ({ subject: scoped }) => sameSubject(note.subject, scoped))
    .exhaustive();
}

/**
 * The store as a screen meets it, ordered newest first as `NoteLister` promises. It counts what it
 * was asked rather than what it answered, so a screen reading once per note is visible in the
 * count rather than only in the answer.
 */
function createNoteStore(seeded: readonly Note[] = []): NoteStore {
  const notes: Note[] = [...seeded];
  const scopes: NoteListScope[] = [];
  let removals = 0;

  return {
    manager: {
      get: (id) => Promise.resolve(notes.find((note) => note.id === id) ?? null),
      getAll: (scope) => {
        scopes.push(scope);

        return Promise.resolve([...notes].reverse().filter((note) => inScope(note, scope)));
      },
      remove: (id) => {
        removals += 1;
        const at = notes.findIndex((note) => note.id === id);

        if (at >= 0) notes.splice(at, 1);

        return Promise.resolve();
      },
      save: (note) => {
        const at = notes.findIndex((held) => held.id === note.id);

        if (at >= 0) notes.splice(at, 1, note);
        else notes.push(note);

        return Promise.resolve();
      },
    },
    notes: () => notes,
    removals: () => removals,
    scopes: () => scopes,
  };
}

interface BookmarkStore {
  readonly manager: BookmarkManager;
  listReads(): number;
  marks(): readonly Bookmark[];
  scopes(): readonly BookmarkListScope[];
  subjectReads(): number;
  writes(): number;
}

function inBookmarkScope(bookmark: Bookmark, scope: BookmarkListScope): boolean {
  return match(scope)
    .with({ type: "all" }, () => true)
    .with({ type: "ofKind" }, ({ kind }) => bookmark.subject.kind === kind)
    .exhaustive();
}

function createBookmarkStore(marked: readonly AnnotationSubject[] = []): BookmarkStore {
  const bookmarks: Bookmark[] = marked.map((subject) => ({ subject, createdAt: MARKED_AT }));
  const scopes: BookmarkListScope[] = [];
  let listReads = 0;
  let subjectReads = 0;
  let writes = 0;

  return {
    manager: {
      get: (asked) => {
        subjectReads += 1;

        return Promise.resolve(bookmarks.find((held) => sameSubject(held.subject, asked)) ?? null);
      },
      getAll: (scope) => {
        listReads += 1;
        scopes.push(scope);

        return Promise.resolve(bookmarks.filter((held) => inBookmarkScope(held, scope)));
      },
      remove: (asked) => {
        writes += 1;
        const at = bookmarks.findIndex((held) => sameSubject(held.subject, asked));

        if (at >= 0) bookmarks.splice(at, 1);

        return Promise.resolve();
      },
      save: (bookmark) => {
        writes += 1;

        if (!bookmarks.some((held) => sameSubject(held.subject, bookmark.subject))) {
          bookmarks.push(bookmark);
        }

        return Promise.resolve();
      },
    },
    listReads: () => listReads,
    marks: () => bookmarks,
    scopes: () => scopes,
    subjectReads: () => subjectReads,
    writes: () => writes,
  };
}

function writtenNote(
  id: string,
  noteSubject: AnnotationSubject | null,
  body: string,
  writtenAt: string,
): Note {
  return { id, subject: noteSubject, title: "", body, createdAt: writtenAt, updatedAt: writtenAt };
}

interface SubjectStore {
  readonly cardSummariesFinder: CardSummariesByPrintingIdsFinder;
  readonly coreRulesFinder: CoreRulesByNumbersFinder;
  cardAsks(): readonly (readonly PrintingId[])[];
  coreRuleAsks(): readonly (readonly CoreRuleNumber[])[];
}

function createSubjectStore(
  cards: readonly CardSummary[] = [],
  coreRules: readonly CoreRule[] = [],
): SubjectStore {
  const cardAsks: (readonly PrintingId[])[] = [];
  const coreRuleAsks: (readonly CoreRuleNumber[])[] = [];

  return {
    cardSummariesFinder: {
      getSummariesByPrintingIds: (printingIds) => {
        cardAsks.push(printingIds);

        return Promise.resolve(cards.filter((card) => printingIds.includes(card.printingId)));
      },
    },
    coreRulesFinder: {
      getAllByNumbers: (numbers) => {
        coreRuleAsks.push(numbers);

        return Promise.resolve(coreRules.filter((coreRule) => numbers.includes(coreRule.number)));
      },
    },
    cardAsks: () => cardAsks,
    coreRuleAsks: () => coreRuleAsks,
  };
}

export {
  createBookmarkStore,
  createNoteStore,
  createSubjectStore,
  fixedClock,
  sequentialIds,
  subject,
  writtenNote,
};
export type { BookmarkStore, NoteStore, SubjectStore };
