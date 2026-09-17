import { useMemo, type ReactNode } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Note } from "@/features/annotation/note";
import type { NoteListScope } from "@/features/annotation/note-list-scope";
import type { NoteManager } from "@/features/annotation/note-manager";
import {
  useNoteEditing,
  type NoteEditing,
} from "@/features/annotation/presentation/hooks/use-note-editing";
import { listNotesQuery } from "@/features/annotation/queries/annotation-queries";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useReadState } from "@/hooks/use-read-state";

/** One subject's notes, newest first. */
interface WrittenNotes extends NoteEditing {
  readonly notes: readonly Note[];
}

interface NotesDataProps {
  readonly children: (written: WrittenNotes) => ReactNode;
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  /** The whole set, because this boundary reads and writes the same rows. */
  readonly noteManager: NoteManager;
  readonly subject: AnnotationSubject;
}

/** `writeNote` refuses a blank body, so removing a note is a separate call on its own control. */
function NotesData({ children, clock, idGenerator, noteManager, subject }: NotesDataProps) {
  const scope = useMemo<NoteListScope>(() => ({ type: "onSubject", subject }), [subject]);
  const { reload, state } = useReadState(listNotesQuery(scope, { noteLister: noteManager }));
  const { removeNote, writeNote } = useNoteEditing({ clock, idGenerator, noteManager });

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your notes."
      />
    ))
    .with({ type: "success" }, ({ notes }) => children({ notes, removeNote, writeNote }))
    .exhaustive();
}

export { NotesData };
export type { NotesDataProps, WrittenNotes };
