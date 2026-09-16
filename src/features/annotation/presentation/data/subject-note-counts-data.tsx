import { useCallback, useMemo, type ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { NoteLister } from "@/features/annotation/note-lister";
import type { NoteListScope } from "@/features/annotation/note-list-scope";
import { listNotesQuery } from "@/features/annotation/queries/annotation-queries";
import type {
  AnnotationSubjectId,
  AnnotationSubjectKind,
} from "@/features/annotation/value-objects/annotation-subject";
import { useReadState } from "@/hooks/use-read-state";

const NO_COUNTS: ReadonlyMap<string, number> = new Map();

/**
 * How many notes each subject of one kind carries. The kind fixes the identifier, so a rule number
 * cannot be asked of a screen of cards.
 */
interface SubjectNoteCounts<TKind extends AnnotationSubjectKind> {
  noteCountOf(id: AnnotationSubjectId<TKind>): number;
}

interface SubjectNoteCountsDataProps<TKind extends AnnotationSubjectKind> {
  readonly children: (counts: SubjectNoteCounts<TKind>) => ReactNode;
  readonly kind: TKind;
  readonly noteLister: NoteLister;
}

/**
 * Every note of one kind in one read, so a document of a thousand rules asks once rather than once
 * per row. A subject's own notes are read again where they are shown, which is the boundary that
 * writes them; this one only counts.
 */
function SubjectNoteCountsData<TKind extends AnnotationSubjectKind>({
  children,
  kind,
  noteLister,
}: SubjectNoteCountsDataProps<TKind>) {
  const scope = useMemo<NoteListScope>(() => ({ type: "ofKind", kind }), [kind]);
  const { reload, state } = useReadState(listNotesQuery(scope, { noteLister }));

  const countsBySubjectId = useMemo(
    () =>
      match(state)
        .with({ type: "success" }, ({ notes }): ReadonlyMap<string, number> => {
          const counted = new Map<string, number>();

          for (const { subject } of notes) {
            if (subject !== null) counted.set(subject.id, (counted.get(subject.id) ?? 0) + 1);
          }

          return counted;
        })
        .with({ type: "loading" }, { type: "failed" }, () => NO_COUNTS)
        .exhaustive(),
    [state],
  );

  const noteCountOf = useCallback(
    (id: AnnotationSubjectId<TKind>) => countsBySubjectId.get(id) ?? 0,
    [countsBySubjectId],
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your notes."
      />
    ))
    .with({ type: "success" }, () => children({ noteCountOf }))
    .exhaustive();
}

export { SubjectNoteCountsData };
export type { SubjectNoteCounts, SubjectNoteCountsDataProps };
