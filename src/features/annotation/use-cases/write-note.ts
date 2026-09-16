import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";

import { noteBodySchema, parseNote, type Note, type NoteId } from "../note";
import type { NoteFinder } from "../note-finder";
import type { NoteSaver } from "../note-saver";
import type { AnnotationSubject } from "../value-objects/annotation-subject";

/** A draft with no id is a note being written for the first time. */
interface NoteDraft {
  readonly id: NoteId | null;
  readonly subject: AnnotationSubject | null;
  readonly title: string;
  readonly body: string;
}

type WriteNoteResult =
  | { readonly type: "created"; readonly note: Note }
  | { readonly type: "updated"; readonly note: Note }
  | { readonly type: "bodyMissing" }
  | { readonly type: "notFound" };

interface WriteNoteCapabilities {
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly noteFinder: NoteFinder;
  readonly noteSaver: NoteSaver;
}

async function writeNote(
  draft: NoteDraft,
  { clock, idGenerator, noteFinder, noteSaver }: WriteNoteCapabilities,
): Promise<WriteNoteResult> {
  const parsedBody = noteBodySchema.safeParse(draft.body);
  if (!parsedBody.success) return { type: "bodyMissing" };

  const writtenAt = clock.now();

  if (draft.id === null) {
    const note = parseNote({
      id: idGenerator.next(),
      subject: draft.subject,
      title: draft.title,
      body: parsedBody.data,
      createdAt: writtenAt,
      updatedAt: writtenAt,
    });
    await noteSaver.save(note);

    return { type: "created", note };
  }

  const current = await noteFinder.get(draft.id);
  if (!current) return { type: "notFound" };

  const note = parseNote({
    ...current,
    subject: draft.subject,
    title: draft.title,
    body: parsedBody.data,
    updatedAt: writtenAt,
  });
  await noteSaver.save(note);

  return { type: "updated", note };
}

export { writeNote };
export type { NoteDraft, WriteNoteCapabilities, WriteNoteResult };
