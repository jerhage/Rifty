import { useMemo, type ReactNode } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import type { NoteManager } from "@/features/annotation/note-manager";
import { useBookmarkToggling } from "@/features/annotation/presentation/hooks/use-bookmark-toggling";
import {
  useNoteEditing,
  type NoteEditing,
} from "@/features/annotation/presentation/hooks/use-note-editing";
import { noteSections, type NoteSection } from "@/features/annotation/presentation/noted-subjects";
import { listNotedSubjectsQuery } from "@/features/annotation/queries/annotation-queries";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummariesByPrintingIdsFinder } from "@/features/card/card-summaries-by-printing-ids-finder";
import type { CoreRulesByNumbersFinder } from "@/features/rules/core-rules-by-numbers-finder";
import { useReadState } from "@/hooks/use-read-state";

const NO_SECTIONS: readonly NoteSection[] = [];

interface SectionedNotes extends NoteEditing {
  removeBookmark(subject: AnnotationSubject): void;
  readonly sections: readonly NoteSection[];
}

interface NoteSectionsDataProps {
  readonly bookmarkManager: BookmarkManager;
  readonly cardSummariesFinder: CardSummariesByPrintingIdsFinder;
  readonly children: (written: SectionedNotes) => ReactNode;
  readonly clock: Clock;
  readonly coreRulesFinder: CoreRulesByNumbersFinder;
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
}

function NoteSectionsData({
  bookmarkManager,
  cardSummariesFinder,
  children,
  clock,
  coreRulesFinder,
  idGenerator,
  noteManager,
}: NoteSectionsDataProps) {
  const { reload, state } = useReadState(
    listNotedSubjectsQuery({
      bookmarkLister: bookmarkManager,
      cardSummariesFinder,
      coreRulesFinder,
      noteLister: noteManager,
    }),
  );
  const { removeNote, writeNote } = useNoteEditing({ clock, idGenerator, noteManager });
  const { toggleBookmark } = useBookmarkToggling({
    bookmarkFinder: bookmarkManager,
    bookmarkRemover: bookmarkManager,
    bookmarkSaver: bookmarkManager,
    clock,
  });

  const sections = useMemo(
    () =>
      match(state)
        .with({ type: "success" }, ({ bookmarks, cards, coreRules, notes }) =>
          noteSections(bookmarks, notes, cards, coreRules),
        )
        .with({ type: "loading" }, { type: "failed" }, () => NO_SECTIONS)
        .exhaustive(),
    [state],
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your notes."
      />
    ))
    .with({ type: "success" }, () =>
      children({ removeBookmark: toggleBookmark, removeNote, sections, writeNote }),
    )
    .exhaustive();
}

export { NoteSectionsData };
export type { NoteSectionsDataProps, SectionedNotes };
