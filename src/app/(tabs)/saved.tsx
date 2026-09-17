import { SavedScreen } from "@/components/app-shell/saved-screen";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { SavedSections } from "@/features/annotation/presentation/components/saved-sections";
import { SavedSectionsData } from "@/features/annotation/presentation/data/saved-sections-data";
import { keptCountsOf } from "@/features/annotation/presentation/saved-subjects";

function SavedRoute() {
  const { annotations, cards, clock, idGenerator, rules } = useAppDependencies();

  return (
    <SavedSectionsData
      bookmarkManager={annotations.bookmarkRepository}
      cardSummariesFinder={cards.cardRepository}
      clock={clock}
      coreRulesFinder={rules.coreRulesRepository}
      idGenerator={idGenerator}
      noteManager={annotations.noteRepository}
    >
      {(saved) => (
        <SavedScreen
          counts={keptCountsOf(saved.sections)}
          sections={<SavedSections saved={saved} />}
        />
      )}
    </SavedSectionsData>
  );
}

export default SavedRoute;
