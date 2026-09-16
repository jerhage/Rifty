import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { NoteList } from "@/features/annotation/presentation/components/note-list";
import type { WrittenNotes } from "@/features/annotation/presentation/data/notes-data";
import {
  SCRATCHPAD_EMPTY_MESSAGE,
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_PLACEHOLDER,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";

interface ScratchpadProps {
  readonly written: WrittenNotes;
}

/** The notes that hang off no subject at all, so every surface showing them shows the same set. */
function Scratchpad({ written }: ScratchpadProps) {
  return (
    <LabelledSection label={SCRATCHPAD_TITLE}>
      <NoteList
        emptyMessage={SCRATCHPAD_EMPTY_MESSAGE}
        notes={written.notes}
        notesName={SCRATCHPAD_NOTES_NAME}
        onRemoveNote={written.removeNote}
        onWriteNote={written.writeNote}
        placeholder={SCRATCHPAD_PLACEHOLDER}
      />
    </LabelledSection>
  );
}

export { Scratchpad };
export type { ScratchpadProps };
