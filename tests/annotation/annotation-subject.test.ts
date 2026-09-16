import type { BookmarkedSubjects } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import {
  annotationSubjectSchema,
  type AnnotationSubject,
} from "@/features/annotation/value-objects/annotation-subject";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { coreRuleNumberSchema } from "@/features/rules/value-objects/core-rule-number";

const PRINTING_ID = printingIdSchema.parse("ogn-119a-298");
const CORE_RULE_NUMBER = coreRuleNumberSchema.parse("103.2.a");

describe("AnnotationSubject", () => {
  it("should name a card by its printing and a core rule by its number", () => {
    const card: AnnotationSubject = { kind: "card", id: PRINTING_ID };
    const coreRule: AnnotationSubject = { kind: "coreRule", id: CORE_RULE_NUMBER };

    expect([card.id, coreRule.id]).toEqual(["ogn-119a-298", "103.2.a"]);
  });

  it("should refuse a core rule number where a card is the subject", () => {
    // @ts-expect-error a core rule number is not a printing id
    const wrong: AnnotationSubject = { kind: "card", id: CORE_RULE_NUMBER };

    expect(wrong.kind).toBe("card");
  });

  it("should refuse a printing id where a core rule is the subject", () => {
    // @ts-expect-error a printing id is not a core rule number
    const wrong: AnnotationSubject = { kind: "coreRule", id: PRINTING_ID };

    expect(wrong.kind).toBe("coreRule");
  });

  it("should refuse a printing id where a screen of rules toggles a mark", () => {
    const toggled: string[] = [];
    const coreRuleMarks: BookmarkedSubjects<"coreRule"> = {
      bookmarkedCount: 0,
      isBookmarked: () => false,
      toggleBookmark: (id) => {
        toggled.push(id);
      },
    };

    coreRuleMarks.toggleBookmark(CORE_RULE_NUMBER);
    // @ts-expect-error a screen of rules marks a core rule number, never a printing
    coreRuleMarks.toggleBookmark(PRINTING_ID);

    expect(toggled).toEqual(["103.2.a", "ogn-119a-298"]);
  });

  it("should refuse a core rule number where a screen of cards toggles a mark", () => {
    const toggled: string[] = [];
    const cardMarks: BookmarkedSubjects<"card"> = {
      bookmarkedCount: 0,
      isBookmarked: () => false,
      toggleBookmark: (id) => {
        toggled.push(id);
      },
    };

    cardMarks.toggleBookmark(PRINTING_ID);
    // @ts-expect-error a screen of cards marks a printing, never a core rule number
    cardMarks.toggleBookmark(CORE_RULE_NUMBER);

    expect(toggled).toEqual(["ogn-119a-298", "103.2.a"]);
  });

  it("should reach a branded id by parsing a stored row rather than by casting", () => {
    const storedCard = annotationSubjectSchema.parse({ kind: "card", id: " ogn-119a-298 " });
    const storedCoreRule = annotationSubjectSchema.parse({ kind: "coreRule", id: " 103.2.a " });
    const card: AnnotationSubject = storedCard;
    const coreRule: AnnotationSubject = storedCoreRule;

    expect([card, coreRule]).toEqual([
      { kind: "card", id: PRINTING_ID },
      { kind: "coreRule", id: CORE_RULE_NUMBER },
    ]);
  });
});
