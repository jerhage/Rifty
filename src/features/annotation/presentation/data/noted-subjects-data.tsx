import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, type ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { NoteId } from "@/features/annotation/note";
import type { NoteManager } from "@/features/annotation/note-manager";
import {
  NOTE_REMOVED_MESSAGE,
  NOTE_REMOVE_FAILED_MESSAGE,
} from "@/features/annotation/presentation/note-format";
import {
  notedSubjectGroups,
  type NotedSubjectGroups,
} from "@/features/annotation/presentation/noted-subjects";
import { annotationKeys } from "@/features/annotation/queries/annotation-keys";
import {
  deleteNoteMutation,
  listNotedSubjectsQuery,
} from "@/features/annotation/queries/annotation-queries";
import type { CardSummariesByPrintingIdsFinder } from "@/features/card/card-summaries-by-printing-ids-finder";
import type { CoreRulesByNumbersFinder } from "@/features/rules/core-rules-by-numbers-finder";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useReadState } from "@/hooks/use-read-state";
import { useWriteState } from "@/hooks/use-write-state";

const NO_GROUPS: NotedSubjectGroups = { cards: [], coreRules: [], unfindable: [] };

interface NotedSubjects {
  readonly groups: NotedSubjectGroups;
  removeNote(id: NoteId): void;
}

interface NotedSubjectsDataProps {
  readonly cardSummariesFinder: CardSummariesByPrintingIdsFinder;
  readonly children: (noted: NotedSubjects) => ReactNode;
  readonly coreRulesFinder: CoreRulesByNumbersFinder;
  readonly noteManager: NoteManager;
}

function NotedSubjectsData({
  cardSummariesFinder,
  children,
  coreRulesFinder,
  noteManager,
}: NotedSubjectsDataProps) {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();
  const { reload, state } = useReadState(
    listNotedSubjectsQuery({ cardSummariesFinder, coreRulesFinder, noteLister: noteManager }),
  );

  const { submit: submitRemoval } = useWriteState({
    ...deleteNoteMutation({ noteRemover: noteManager }),
    onError: () => announce(NOTE_REMOVE_FAILED_MESSAGE, "interrupting"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: annotationKeys.notes() });
      announce(NOTE_REMOVED_MESSAGE, "interrupting");
    },
  });

  const groups = useMemo(
    () =>
      match(state)
        .with({ type: "success" }, ({ cards, coreRules, notes }) =>
          notedSubjectGroups(notes, cards, coreRules),
        )
        .with({ type: "loading" }, { type: "failed" }, () => NO_GROUPS)
        .exhaustive(),
    [state],
  );

  const removeNote = useCallback((id: NoteId) => submitRemoval(id), [submitRemoval]);

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load your notes."
      />
    ))
    .with({ type: "success" }, () => children({ groups, removeNote }))
    .exhaustive();
}

export { NotedSubjectsData };
export type { NotedSubjects, NotedSubjectsDataProps };
