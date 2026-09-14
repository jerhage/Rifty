import { z } from "zod/v4";

/** Stable game-card identity retained by a deck even when catalog data is reseeded. */
import { cardIdSchema, type CardId } from "@/features/card/value-objects/card-id";
import type { CardType } from "@/features/card/value-objects/card-type";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import type { TaxonomyId } from "@/features/card/value-objects/taxonomy-id";

const deckIdSchema = z.string().trim().min(1);
const deckNameSchema = z.string().trim().min(1);
const deckSectionSchema = z.enum(["legend", "mainDeck", "runeDeck", "battlefield", "sideboard"]);
const DECK_SECTIONS = deckSectionSchema.options;
const deckEntrySchema = z.object({
  section: deckSectionSchema,
  cardId: cardIdSchema,
  printingId: printingIdSchema,
  quantity: z.number().int().positive(),
});

/**
 * A saved deck intentionally permits incomplete and tournament-illegal compositions. It only
 * enforces structural invariants needed to store and edit card quantities unambiguously.
 *
 * The chosen champion is one of the main deck's cards, named here so the game knows which card
 * starts in the champion zone. It is not a section of its own.
 */
const deckSchema = z
  .object({
    id: deckIdSchema,
    name: deckNameSchema,
    notes: z.string(),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().min(1),
    chosenChampionCardId: cardIdSchema.nullable(),
    entries: z.array(deckEntrySchema),
  })
  .superRefine((deck, context) => {
    const entryIndexesByKey = new Map<string, number>();
    deck.entries.forEach((entry, index) => {
      const key = `${entry.section}\u0000${entry.cardId}\u0000${entry.printingId}`;
      if (entryIndexesByKey.has(key)) {
        context.addIssue({
          code: "custom",
          message: "A deck may have only one quantity entry for a printing in each section.",
          path: ["entries", index],
        });
      }
      entryIndexesByKey.set(key, index);
    });
  });

const tournamentRulesetSchema = z.object({
  id: z.string().trim().min(1),
  format: z.string().trim().min(1),
  version: z.string().trim().min(1),
});

const deckLegalityRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("sectionRequired"), section: deckSectionSchema }),
  z.object({ kind: z.literal("sectionSize"), section: deckSectionSchema }),
  z.object({ kind: z.literal("sectionCopyLimit"), section: deckSectionSchema }),
  z.object({ kind: z.literal("sharedCopyLimit") }),
  z.object({ kind: z.literal("championRequired") }),
  z.object({ kind: z.literal("championInMainDeck") }),
  z.object({ kind: z.literal("championIsChampionUnit") }),
]);

const deckLegalityViolationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("deckConstraint"),
    rule: deckLegalityRuleSchema,
    message: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("cardConstraint"),
    cardId: cardIdSchema,
    printingIds: z.array(printingIdSchema),
    rule: deckLegalityRuleSchema,
    message: z.string().trim().min(1),
  }),
]);

/**
 * A derived assessment, never a persisted deck field: catalog data and tournament rules can change.
 *
 * `ruleset` is kept deliberately although nothing reads it yet. Which ruleset judged a deck is a
 * real fact about the verification, and it becomes meaningful as soon as a second format exists.
 */
const deckVerificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("legal"),
    ruleset: tournamentRulesetSchema,
  }),
  z.object({
    type: z.literal("illegal"),
    ruleset: tournamentRulesetSchema,
    violations: z.array(deckLegalityViolationSchema).min(1),
  }),
]);

function parseDeck(value: unknown): Deck {
  return deckSchema.parse(value);
}

function parseDeckVerification(value: unknown): DeckVerification {
  return deckVerificationSchema.parse(value);
}

type DeckId = z.output<typeof deckIdSchema>;
type DeckName = z.output<typeof deckNameSchema>;
type DeckSection = z.output<typeof deckSectionSchema>;
type DeckEntry = z.output<typeof deckEntrySchema>;
type Deck = z.output<typeof deckSchema>;
/** The champion a deck names, carrying the kind of card it is because the rules judge that too. */
interface ChosenChampion {
  readonly cardId: CardId;
  readonly typeId: CardType;
  readonly supertypeId: TaxonomyId | null;
}
interface DeckComposition {
  readonly entries: readonly DeckEntry[];
  readonly chosenChampion: ChosenChampion | null;
}
type TournamentRuleset = z.output<typeof tournamentRulesetSchema>;
type DeckLegalityRule = z.output<typeof deckLegalityRuleSchema>;
type DeckLegalityViolation = z.output<typeof deckLegalityViolationSchema>;
type DeckVerification = z.output<typeof deckVerificationSchema>;
type LegalVerification = Extract<DeckVerification, { type: "legal" }>;
type IllegalVerification = Extract<DeckVerification, { type: "illegal" }>;

export {
  DECK_SECTIONS,
  deckEntrySchema,
  deckIdSchema,
  deckLegalityRuleSchema,
  deckLegalityViolationSchema,
  deckNameSchema,
  deckSchema,
  deckSectionSchema,
  deckVerificationSchema,
  parseDeck,
  parseDeckVerification,
  tournamentRulesetSchema,
};
export type {
  ChosenChampion,
  Deck,
  DeckComposition,
  DeckEntry,
  DeckId,
  DeckLegalityRule,
  DeckLegalityViolation,
  DeckName,
  DeckSection,
  DeckVerification,
  IllegalVerification,
  LegalVerification,
  TournamentRuleset,
};
