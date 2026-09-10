import { z } from "zod/v4";

/** Stable game-card identity retained by a deck even when catalog data is reseeded. */
import { cardIdSchema } from "@/features/card/value-objects/card-id";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";

const deckIdSchema = z.string().trim().min(1);
const deckNameSchema = z.string().trim().min(1);
const deckSectionSchema = z.enum(["legend", "mainDeck", "runeDeck", "battlefield", "sideboard"]);
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

const deckUnverifiedReasonSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("notChecked") }),
  z.object({
    type: z.literal("missingCards"),
    cardIds: z.array(cardIdSchema).min(1),
  }),
  z.object({ type: z.literal("unknownRuleset") }),
]);

const deckLegalityViolationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("deckConstraint"),
    rule: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("cardConstraint"),
    cardId: cardIdSchema,
    printingIds: z.array(printingIdSchema),
    rule: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
]);

/** A derived assessment, never a persisted deck field: catalog data and tournament rules can change. */
const deckVerificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("unverified"),
    deck: deckSchema,
    reason: deckUnverifiedReasonSchema,
  }),
  z.object({
    type: z.literal("legal"),
    deck: deckSchema,
    ruleset: tournamentRulesetSchema,
  }),
  z.object({
    type: z.literal("illegal"),
    deck: deckSchema,
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
type TournamentRuleset = z.output<typeof tournamentRulesetSchema>;
type DeckUnverifiedReason = z.output<typeof deckUnverifiedReasonSchema>;
type DeckLegalityViolation = z.output<typeof deckLegalityViolationSchema>;
type DeckVerification = z.output<typeof deckVerificationSchema>;
type UnverifiedDeck = Extract<DeckVerification, { type: "unverified" }>;
type LegalDeck = Extract<DeckVerification, { type: "legal" }>;
type IllegalDeck = Extract<DeckVerification, { type: "illegal" }>;

export {
  deckEntrySchema,
  deckIdSchema,
  deckLegalityViolationSchema,
  deckNameSchema,
  deckSchema,
  deckSectionSchema,
  deckUnverifiedReasonSchema,
  deckVerificationSchema,
  parseDeck,
  parseDeckVerification,
  tournamentRulesetSchema,
};
export type {
  Deck,
  DeckEntry,
  DeckId,
  DeckLegalityViolation,
  DeckName,
  DeckSection,
  DeckUnverifiedReason,
  DeckVerification,
  IllegalDeck,
  LegalDeck,
  TournamentRuleset,
  UnverifiedDeck,
};
