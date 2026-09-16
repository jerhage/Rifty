import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
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

        return Promise.resolve(
          [...notes]
            .reverse()
            .filter((note) =>
              scope.type === "all"
                ? true
                : scope.type === "standalone"
                  ? note.subject === null
                  : sameSubject(note.subject, scope.subject),
            ),
        );
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

export { createNoteStore, createSubjectStore, fixedClock, sequentialIds, subject, writtenNote };
export type { NoteStore, SubjectStore };
