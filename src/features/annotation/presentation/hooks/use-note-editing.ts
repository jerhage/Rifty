import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { NoteId } from "@/features/annotation/note";
import type { NoteManager } from "@/features/annotation/note-manager";
import type { WriteNote } from "@/features/annotation/presentation/components/note-card";
import {
  NOTE_BLANK_MESSAGE,
  NOTE_FAILED_MESSAGE,
  NOTE_GONE_MESSAGE,
  NOTE_REMOVED_MESSAGE,
  NOTE_REMOVE_FAILED_MESSAGE,
  NOTE_REPLACED_MESSAGE,
  NOTE_WRITTEN_MESSAGE,
} from "@/features/annotation/presentation/note-format";
import { annotationKeys } from "@/features/annotation/queries/annotation-keys";
import {
  deleteNoteMutation,
  writeNoteMutation,
} from "@/features/annotation/queries/annotation-queries";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useWriteState } from "@/hooks/use-write-state";

interface NoteEditing {
  removeNote(id: NoteId): void;
  writeNote: WriteNote;
}

interface NoteEditingDependencies {
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
}

function useNoteEditing({ clock, idGenerator, noteManager }: NoteEditingDependencies): NoteEditing {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();

  const refreshNotesAndSavedSubjects = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: annotationKeys.notes() });
    void queryClient.invalidateQueries({ queryKey: annotationKeys.savedSubjects() });
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
      refreshNotesAndSavedSubjects();
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
      refreshNotesAndSavedSubjects();
      announce(NOTE_REMOVED_MESSAGE, "interrupting");
    },
  });

  const writeNote = useCallback<WriteNote>(
    (subject, id, body) => submitWrite({ id, subject, title: "", body }),
    [submitWrite],
  );

  return { removeNote: submitRemoval, writeNote };
}

export { useNoteEditing };
export type { NoteEditing, NoteEditingDependencies };
