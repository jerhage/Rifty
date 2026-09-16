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

export { createNoteStore, fixedClock, sequentialIds, subject };
export type { NoteStore };
