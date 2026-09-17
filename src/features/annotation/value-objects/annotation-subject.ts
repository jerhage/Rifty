import { z } from "zod/v4";

import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { deckIdSchema } from "@/features/deck/deck/deck";
import { coreRuleNumberSchema } from "@/features/rules/value-objects/core-rule-number";

const annotationSubjectKindSchema = z.enum(["coreRule", "card", "deck"]);

/**
 * What a bookmark or a note is about. Each kind carries the identifier its own feature owns, so the
 * union states both what may be annotated and which identity names it. A printing rather than a
 * card, because a mark is made on the thing on screen.
 *
 * The union is a vocabulary rather than a permission: nothing offers to bookmark every kind today,
 * and a subject that no longer resolves is detected where it is read rather than guarded here.
 */
const annotationSubjectSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("coreRule"), id: coreRuleNumberSchema }),
    z.object({ kind: z.literal("card"), id: printingIdSchema }),
    z.object({ kind: z.literal("deck"), id: deckIdSchema }),
  ])
  .readonly();

type AnnotationSubjectKind = z.output<typeof annotationSubjectKindSchema>;
type AnnotationSubject = z.output<typeof annotationSubjectSchema>;
type AnnotationSubjectOf<TKind extends AnnotationSubjectKind> = Extract<
  AnnotationSubject,
  { kind: TKind }
>;
type AnnotationSubjectId<TKind extends AnnotationSubjectKind> = AnnotationSubjectOf<TKind>["id"];

export { annotationSubjectKindSchema, annotationSubjectSchema };
export type { AnnotationSubject, AnnotationSubjectId, AnnotationSubjectKind };
