import { useCallback, useState } from "react";

import type { WriteNote } from "@/features/annotation/presentation/components/note-card";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";

type NoteDraft = { readonly type: "composing"; readonly body: string } | { readonly type: "idle" };

interface NoteDrafting {
  beginDraft(): void;
  changeDraftBody(body: string): void;
  discardDraft(): void;
  readonly draft: NoteDraft;
  saveDraft(subject: AnnotationSubject | null, body: string): void;
}

const IDLE_DRAFT: NoteDraft = { type: "idle" };

function useNoteDrafting(writeNote: WriteNote): NoteDrafting {
  const [draft, setDraft] = useState<NoteDraft>(IDLE_DRAFT);

  const beginDraft = useCallback(() => setDraft({ type: "composing", body: "" }), []);

  const changeDraftBody = useCallback((body: string) => setDraft({ type: "composing", body }), []);

  const discardDraft = useCallback(() => setDraft(IDLE_DRAFT), []);

  const saveDraft = useCallback(
    (subject: AnnotationSubject | null, body: string) => {
      writeNote(subject, null, body);
      setDraft(IDLE_DRAFT);
    },
    [writeNote],
  );

  return { beginDraft, changeDraftBody, discardDraft, draft, saveDraft };
}

export { useNoteDrafting };
export type { NoteDraft, NoteDrafting };
