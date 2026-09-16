import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, type ReactNode } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Note, NoteId } from "@/features/annotation/note";
import type { NoteListScope } from "@/features/annotation/note-list-scope";
import type { NoteManager } from "@/features/annotation/note-manager";
import { annotationKeys } from "@/features/annotation/queries/annotation-keys";
import {
  deleteNoteMutation,
  listNotesQuery,
  writeNoteMutation,
} from "@/features/annotation/queries/annotation-queries";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useReadState } from "@/hooks/use-read-state";
import { useWriteState } from "@/hooks/use-write-state";

const NOTE_WRITTEN_MESSAGE = "Note added.";
const NOTE_REPLACED_MESSAGE = "Note saved.";
const NOTE_BLANK_MESSAGE = "A note needs something written in it.";
const NOTE_GONE_MESSAGE = "That note is no longer there.";
const NOTE_REMOVED_MESSAGE = "Note removed.";
const NOTE_FAILED_MESSAGE = "Could not save that note. Try again.";
const NOTE_REMOVE_FAILED_MESSAGE = "Could not remove that note. Try again.";

/** One subject's notes, newest first. */
interface SubjectNotes {
  readonly notes: readonly Note[];
  removeNote(id: NoteId): void;
  writeNote(id: NoteId | null, body: string): void;
}

interface SubjectNotesDataProps {
  readonly children: (notes: SubjectNotes) => ReactNode;
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  /** The whole set, because this boundary reads and writes the same rows. */
  readonly noteManager: NoteManager;
  readonly subject: AnnotationSubject;
}

/** `writeNote` refuses a blank body, so removing a note is a separate call on its own control. */
function SubjectNotesData({
  children,
  clock,
  idGenerator,
  noteManager,
  subject,
}: SubjectNotesDataProps) {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();
  const scope = useMemo<NoteListScope>(() => ({ type: "onSubject", subject }), [subject]);
  const { reload, state } = useReadState(listNotesQuery(scope, { noteLister: noteManager }));

  /** One note is read through several scopes, so the whole subtree goes stale. Marks are untouched. */
  const refreshNotes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: annotationKeys.notes() });
  }, [queryClient]);

  const { submit: submitWrite } = useWriteState({
    ...writeNoteMutation({
      clock,
      idGenerator,
      noteFinder: noteManager,
      noteSaver: noteManager,
    }),
    onError: () => announce(NOTE_FAILED_MESSAGE, "interrupting"),
    onSuccess: (result) => {
      refreshNotes();
      announce(
        match(result)
          .with({ type: "created" }, () => NOTE_WRITTEN_MESSAGE)
          .with({ type: "updated" }, () => NOTE_REPLACED_MESSAGE)
          .with({ type: "bodyMissing" }, () => NOTE_BLANK_MESSAGE)
          .with({ type: "notFound" }, () => NOTE_GONE_MESSAGE)
          .exhaustive(),
        "interrupting",
      );
    },
  });

  const { submit: submitRemoval } = useWriteState({
    ...deleteNoteMutation({ noteRemover: noteManager }),
    onError: () => announce(NOTE_REMOVE_FAILED_MESSAGE, "interrupting"),
    onSuccess: () => {
      refreshNotes();
      announce(NOTE_REMOVED_MESSAGE, "interrupting");
    },
  });

  const writeNote = useCallback(
    (id: NoteId | null, body: string) => submitWrite({ id, subject, title: "", body }),
    [subject, submitWrite],
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your notes."
      />
    ))
    .with({ type: "success" }, ({ notes }) =>
      children({ notes, removeNote: submitRemoval, writeNote }),
    )
    .exhaustive();
}

export { NOTE_BLANK_MESSAGE, NOTE_REMOVED_MESSAGE, NOTE_WRITTEN_MESSAGE, SubjectNotesData };
export type { SubjectNotes, SubjectNotesDataProps };
