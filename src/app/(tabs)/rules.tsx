import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import { CoreRulesData } from "@/features/rules/presentation/data/core-rules-data";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

function RulesRoute() {
  const { annotations, clock, idGenerator, rules } = useAppDependencies();

  return (
    <CoreRulesData
      coreRuleLister={rules.coreRulesRepository}
      coreRulesEditionFinder={rules.coreRulesRepository}
    >
      {({ coreRules, edition }) => (
        <BookmarkedSubjectsData
          bookmarkManager={annotations.bookmarkRepository}
          clock={clock}
          kind="coreRule"
        >
          {({ bookmarkedIds, toggleBookmark }) => (
            <CoreRulesScreen
              bookmarkedNumbers={bookmarkedIds}
              clock={clock}
              coreRules={coreRules}
              edition={edition}
              idGenerator={idGenerator}
              noteManager={annotations.noteRepository}
              onToggleBookmark={toggleBookmark}
            />
          )}
        </BookmarkedSubjectsData>
      )}
    </CoreRulesData>
  );
}

export default RulesRoute;
