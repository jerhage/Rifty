import { SavedScreen } from "@/components/app-shell/saved-screen";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { NoteSections } from "@/features/annotation/presentation/components/note-sections";
import { NoteSectionsData } from "@/features/annotation/presentation/data/note-sections-data";
import { noteCountsOf } from "@/features/annotation/presentation/noted-subjects";

function SavedRoute() {
  const { annotations, cards, clock, idGenerator, rules } = useAppDependencies();

  return (
    <NoteSectionsData
      bookmarkLister={annotations.bookmarkRepository}
      cardSummariesFinder={cards.cardRepository}
      clock={clock}
      coreRulesFinder={rules.coreRulesRepository}
      idGenerator={idGenerator}
      noteManager={annotations.noteRepository}
    >
      {(written) => (
        <SavedScreen
          notes={<NoteSections written={written} />}
          noteCounts={noteCountsOf(written.sections)}
        />
      )}
    </NoteSectionsData>
  );
}

export default SavedRoute;
