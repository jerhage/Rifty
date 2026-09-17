import { SavedScreen } from "@/components/app-shell/saved-screen";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { NoteSections } from "@/features/annotation/presentation/components/note-sections";
import { NoteSectionsData } from "@/features/annotation/presentation/data/note-sections-data";
import { keptCountsOf } from "@/features/annotation/presentation/noted-subjects";

function SavedRoute() {
  const { annotations, cards, clock, idGenerator, rules } = useAppDependencies();

  return (
    <NoteSectionsData
      bookmarkManager={annotations.bookmarkRepository}
      cardSummariesFinder={cards.cardRepository}
      clock={clock}
      coreRulesFinder={rules.coreRulesRepository}
      idGenerator={idGenerator}
      noteManager={annotations.noteRepository}
    >
      {(written) => (
        <SavedScreen
          counts={keptCountsOf(written.sections)}
          notes={<NoteSections written={written} />}
        />
      )}
    </NoteSectionsData>
  );
}

export default SavedRoute;
