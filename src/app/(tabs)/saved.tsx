import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { Scratchpad } from "@/features/annotation/presentation/components/scratchpad";
import { NotesData } from "@/features/annotation/presentation/data/notes-data";
import { SavedScreen } from "@/features/saved/presentation/screens/saved-screen";

function SavedRoute() {
  const { annotations, clock, idGenerator } = useAppDependencies();

  return (
    <NotesData
      clock={clock}
      idGenerator={idGenerator}
      noteManager={annotations.noteRepository}
      subject={null}
    >
      {(written) => (
        <SavedScreen
          scratchpad={<Scratchpad written={written} />}
          scratchpadNoteCount={written.notes.length}
        />
      )}
    </NotesData>
  );
}

export default SavedRoute;
