import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { BookmarkToggle } from "@/features/annotation/presentation/components/bookmark-toggle";
import { NotesControl } from "@/features/annotation/presentation/components/notes-control";
import { SubjectNotes } from "@/features/annotation/presentation/components/subject-notes";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import { SubjectNoteCountsData } from "@/features/annotation/presentation/data/subject-note-counts-data";
import { notesOnLabel } from "@/features/annotation/presentation/note-format";
import { coreRuleBookmarkLabel } from "@/features/rules/presentation/core-rules-format";
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
          {({ bookmarkedCount, isBookmarked, toggleBookmark }) => (
            <SubjectNoteCountsData kind="coreRule" noteLister={annotations.noteRepository}>
              {({ noteCountOf }) => (
                <CoreRulesScreen
                  bookmarkedCount={bookmarkedCount}
                  bookmarkFor={(number) => (
                    <BookmarkToggle
                      alignment="start"
                      bookmarked={isBookmarked(number)}
                      label={coreRuleBookmarkLabel(number)}
                      onPress={() => toggleBookmark(number)}
                    />
                  )}
                  coreRules={coreRules}
                  edition={edition}
                  isBookmarked={isBookmarked}
                  isNoted={(number) => noteCountOf(number) > 0}
                  notesControlFor={(number, onOpen) => (
                    <NotesControl
                      count={noteCountOf(number)}
                      label={notesOnLabel(number)}
                      onPress={onOpen}
                    />
                  )}
                  notesFor={(number) => (
                    <SubjectNotes
                      clock={clock}
                      idGenerator={idGenerator}
                      noteManager={annotations.noteRepository}
                      notesName={number}
                      subject={{ kind: "coreRule", id: number }}
                    />
                  )}
                  onRemoveBookmark={toggleBookmark}
                />
              )}
            </SubjectNoteCountsData>
          )}
        </BookmarkedSubjectsData>
      )}
    </CoreRulesData>
  );
}

export default RulesRoute;
