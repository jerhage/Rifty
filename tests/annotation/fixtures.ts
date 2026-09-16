import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
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

export { fixedClock, sequentialIds, subject };
