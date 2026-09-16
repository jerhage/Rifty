import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { NoteManager } from "@/features/annotation/note-manager";
import { NoteList } from "@/features/annotation/presentation/components/note-list";
import { NotesData } from "@/features/annotation/presentation/data/notes-data";
import {
  NOTES_EMPTY_MESSAGE,
  NOTE_PLACEHOLDER,
} from "@/features/annotation/presentation/note-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";

interface SubjectNotesProps {
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
  /** What the subject is called on screen, so a screen showing several does not read alike. */
  readonly notesName: string;
  readonly subject: AnnotationSubject;
}

/** Everything one subject carries, read and written wherever that subject is shown. */
function SubjectNotes({ clock, idGenerator, noteManager, notesName, subject }: SubjectNotesProps) {
  return (
    <NotesData clock={clock} idGenerator={idGenerator} noteManager={noteManager} subject={subject}>
      {({ notes, removeNote, writeNote }) => (
        <NoteList
          emptyMessage={NOTES_EMPTY_MESSAGE}
          notes={notes}
          notesName={notesName}
          onRemoveNote={removeNote}
          onWriteNote={writeNote}
          placeholder={NOTE_PLACEHOLDER}
          writing={{ type: "offered", subject }}
        />
      )}
    </NotesData>
  );
}

export { SubjectNotes };
export type { SubjectNotesProps };
