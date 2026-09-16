import { SavedScreen } from "@/components/app-shell/saved-screen";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { NotedSubjectSections } from "@/features/annotation/presentation/components/noted-subject-sections";
import { Scratchpad } from "@/features/annotation/presentation/components/scratchpad";
import { NotedSubjectsData } from "@/features/annotation/presentation/data/noted-subjects-data";
import { NotesData } from "@/features/annotation/presentation/data/notes-data";

function SavedRoute() {
  const { annotations, cards, clock, idGenerator, rules } = useAppDependencies();

  return (
    <NotesData
      clock={clock}
      idGenerator={idGenerator}
      noteManager={annotations.noteRepository}
      subject={null}
    >
      {(written) => (
        <SavedScreen
          notes={
            <NotedSubjectsData
              cardSummariesFinder={cards.cardRepository}
              coreRulesFinder={rules.coreRulesRepository}
              noteManager={annotations.noteRepository}
            >
              {(noted) => <NotedSubjectSections noted={noted} />}
            </NotedSubjectsData>
          }
          scratchpad={<Scratchpad written={written} />}
          scratchpadNoteCount={written.notes.length}
        />
      )}
    </NotesData>
  );
}

export default SavedRoute;
