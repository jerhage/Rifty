import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import type { NoteManager } from "@/features/annotation/note-manager";
import { NoteList } from "@/features/annotation/presentation/components/note-list";
import { NotesData } from "@/features/annotation/presentation/data/notes-data";
import {
  SCRATCHPAD_EMPTY_MESSAGE,
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_PLACEHOLDER,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";

interface ScratchpadProps {
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
}

/** The notes that hang off no subject at all, so every surface showing them shows the same set. */
function Scratchpad({ clock, idGenerator, noteManager }: ScratchpadProps) {
  return (
    <LabelledSection label={SCRATCHPAD_TITLE}>
      <NotesData clock={clock} idGenerator={idGenerator} noteManager={noteManager} subject={null}>
        {({ notes, removeNote, writeNote }) => (
          <NoteList
            emptyMessage={SCRATCHPAD_EMPTY_MESSAGE}
            notes={notes}
            notesName={SCRATCHPAD_NOTES_NAME}
            onRemoveNote={removeNote}
            onWriteNote={writeNote}
            placeholder={SCRATCHPAD_PLACEHOLDER}
          />
        )}
      </NotesData>
    </LabelledSection>
  );
}

export { Scratchpad };
export type { ScratchpadProps };
