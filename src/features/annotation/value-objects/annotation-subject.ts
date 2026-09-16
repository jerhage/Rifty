import { z } from "zod/v4";

const annotationSubjectKindSchema = z.enum(["coreRule", "card", "deck"]);

/**
 * What a bookmark or a note is about. The id is a plain string rather than another feature's
 * branded id, which is what keeps this feature a leaf that card, deck and rules may all depend on.
 *
 * The union is a vocabulary rather than a permission: nothing offers to bookmark every kind today,
 * and a subject that no longer resolves is detected where it is read rather than guarded here.
 */
const annotationSubjectSchema = z.object({
  kind: annotationSubjectKindSchema,
  id: z.string().trim().min(1),
});

type AnnotationSubjectKind = z.output<typeof annotationSubjectKindSchema>;
type AnnotationSubject = z.output<typeof annotationSubjectSchema>;

export { annotationSubjectKindSchema, annotationSubjectSchema };
export type { AnnotationSubject, AnnotationSubjectKind };
