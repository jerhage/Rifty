import { match, P } from "ts-pattern";
import { z } from "zod/v4";

import type { CardId } from "@/features/card/value-objects/card-id";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { taxonomyIdSchema, type TaxonomyId } from "@/features/card/value-objects/taxonomy-id";

import {
  parseDeckVerification,
  type ChosenChampion,
  type DeckComposition,
  type DeckEntry,
  type DeckLegalityViolation,
  type DeckSection,
  type DeckVerification,
  type TournamentRuleset,
} from "./deck";

const copyAllowanceSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("limited"), copies: z.number().int().nonnegative() }),
    z.object({ type: z.literal("unlimited") }),
  ])
  .readonly();

type CopyAllowance = z.output<typeof copyAllowanceSchema>;

const UNLIMITED_COPIES: CopyAllowance = { type: "unlimited" };

function limitedCopies(copies: number): CopyAllowance {
  return { type: "limited", copies: Math.max(0, copies) };
}

function narrowerAllowance(left: CopyAllowance, right: CopyAllowance): CopyAllowance {
  return match([left, right] as const)
    .with([{ type: "unlimited" }, P._], () => right)
    .with([P._, { type: "unlimited" }], () => left)
    .with([{ type: "limited" }, { type: "limited" }], ([byLeft, byRight]) =>
      limitedCopies(Math.min(byLeft.copies, byRight.copies)),
    )
    .exhaustive();
}

function remainingAllowance(allowance: CopyAllowance, heldCopies: number): CopyAllowance {
  return match(allowance)
    .with({ type: "unlimited" }, () => UNLIMITED_COPIES)
    .with({ type: "limited" }, ({ copies }) => limitedCopies(copies - heldCopies))
    .exhaustive();
}

interface HeldCopies {
  readonly copies: number;
  readonly printingIds: PrintingId[];
}

/** How many cards a section must hold, and how many copies of one card it will take. */
interface SectionRule {
  readonly section: DeckSection;
  readonly label: string;
  readonly requiredCount: number;
  readonly copyAllowance: CopyAllowance;
}

const SECTION_RULES_BY_SECTION: Readonly<Record<DeckSection, SectionRule>> = {
  legend: {
    section: "legend",
    label: "Legend",
    requiredCount: 1,
    copyAllowance: { type: "limited", copies: 1 },
  },
  mainDeck: {
    section: "mainDeck",
    label: "Main deck",
    requiredCount: 40,
    copyAllowance: { type: "limited", copies: 3 },
  },
  runeDeck: {
    section: "runeDeck",
    label: "Rune deck",
    requiredCount: 12,
    copyAllowance: { type: "unlimited" },
  },
  battlefield: {
    section: "battlefield",
    label: "Battlefields",
    requiredCount: 3,
    copyAllowance: { type: "limited", copies: 1 },
  },
  sideboard: {
    section: "sideboard",
    label: "Sideboard",
    requiredCount: 10,
    copyAllowance: { type: "limited", copies: 3 },
  },
};

/** The sections a deck fills with a count of cards. The legend is one pick, verified on its own. */
const COUNTED_SECTION_RULES: readonly SectionRule[] = [
  SECTION_RULES_BY_SECTION.mainDeck,
  SECTION_RULES_BY_SECTION.runeDeck,
  SECTION_RULES_BY_SECTION.battlefield,
  SECTION_RULES_BY_SECTION.sideboard,
];

function sectionRule(section: DeckSection): SectionRule {
  return SECTION_RULES_BY_SECTION[section];
}

/**
 * Three copies of a name in total across the main deck and the sideboard, so a card cannot hide
 * extra copies in one of them.
 */
const SHARED_COPY_LIMIT = 3;
const SHARED_COPY_SECTIONS: readonly DeckSection[] = ["mainDeck", "sideboard"];

/**
 * A Chosen Champion is a champion unit. The supertype alone does not settle it: legends carry it
 * too, so the card pool that offers champions and the rule that judges one read this same pair.
 */
const CHAMPION_UNIT: { readonly typeId: CardType; readonly supertypeId: TaxonomyId } = {
  typeId: "Unit",
  supertypeId: taxonomyIdSchema.parse("Champion"),
};

function isChampionUnit(champion: ChosenChampion): boolean {
  return (
    champion.typeId === CHAMPION_UNIT.typeId && champion.supertypeId === CHAMPION_UNIT.supertypeId
  );
}

const RIFTBOUND_STANDARD: TournamentRuleset = {
  id: "riftbound-standard",
  format: "Standard",
  version: "2026.1",
};

/** Sections whose copies of a card count against the same allowance as `section`. */
function sectionsSharingAllowance(section: DeckSection): readonly DeckSection[] {
  return match(section)
    .with("mainDeck", "sideboard", () => SHARED_COPY_SECTIONS)
    .with("legend", "runeDeck", "battlefield", (alone): readonly DeckSection[] => [alone])
    .exhaustive();
}

function copyAllowance(section: DeckSection): CopyAllowance {
  return match(section)
    .with("mainDeck", "sideboard", () => limitedCopies(SHARED_COPY_LIMIT))
    .with("legend", "runeDeck", "battlefield", (alone) => sectionRule(alone).copyAllowance)
    .exhaustive();
}

/** Copies of a card already held in the sections that share this one's allowance. */
function copiesHeldElsewhere(
  entries: readonly DeckEntry[],
  section: DeckSection,
  cardId: CardId,
  printingId: PrintingId,
): number {
  const sharing = sectionsSharingAllowance(section);

  return entries
    .filter(
      (entry) =>
        entry.cardId === cardId &&
        sharing.includes(entry.section) &&
        !(entry.section === section && entry.printingId === printingId),
    )
    .reduce((total, entry) => total + entry.quantity, 0);
}

function remainingCopies(
  entries: readonly DeckEntry[],
  section: DeckSection,
  cardId: CardId,
  printingId: PrintingId,
): CopyAllowance {
  return remainingAllowance(
    copyAllowance(section),
    copiesHeldElsewhere(entries, section, cardId, printingId),
  );
}

function copiesByCard(
  composition: DeckComposition,
  sections: readonly DeckSection[],
): Map<CardId, HeldCopies> {
  const held = new Map<CardId, HeldCopies>();

  for (const entry of composition.entries) {
    if (!sections.includes(entry.section)) continue;

    const current = held.get(entry.cardId);
    held.set(entry.cardId, {
      copies: (current?.copies ?? 0) + entry.quantity,
      printingIds: current?.printingIds.includes(entry.printingId)
        ? current.printingIds
        : [...(current?.printingIds ?? []), entry.printingId],
    });
  }

  return held;
}

function verifyDeck(composition: DeckComposition, ruleset: TournamentRuleset): DeckVerification {
  const violations = [
    ...singletonViolations(composition, "legend"),
    ...championViolations(composition),
    ...COUNTED_SECTION_RULES.flatMap((rule) => sectionViolations(composition, rule)),
    ...sharedCopyViolations(composition),
  ];

  return parseDeckVerification(
    violations.length === 0 ? { type: "legal", ruleset } : { type: "illegal", ruleset, violations },
  );
}

/** The legend and the chosen champion are each exactly one card, outside every other count. */
function singletonViolations(
  composition: DeckComposition,
  section: DeckSection,
): readonly DeckLegalityViolation[] {
  const { label } = sectionRule(section);
  const total = sectionTotal(composition, section);

  if (total === 1) return [];

  return [
    {
      type: "deckConstraint",
      rule: { kind: "sectionRequired", section },
      message: total === 0 ? `Pick a ${label}.` : `A deck has one ${label}, not ${total}.`,
    },
  ];
}

function championViolations(composition: DeckComposition): readonly DeckLegalityViolation[] {
  const champion = composition.chosenChampion;

  if (champion === null) {
    return [
      {
        type: "deckConstraint",
        rule: { kind: "championRequired" },
        message: "Pick a Chosen Champion.",
      },
    ];
  }

  return [...championKindViolations(champion), ...championSeatViolations(composition, champion)];
}

function championKindViolations(champion: ChosenChampion): readonly DeckLegalityViolation[] {
  return isChampionUnit(champion)
    ? []
    : [
        {
          type: "cardConstraint",
          cardId: champion.cardId,
          printingIds: [],
          rule: { kind: "championIsChampionUnit" },
          message: "Your Chosen Champion has to be a champion unit.",
        },
      ];
}

/** The chosen champion is a main deck card, so the deck has to actually hold a copy of it. */
function championSeatViolations(
  composition: DeckComposition,
  champion: ChosenChampion,
): readonly DeckLegalityViolation[] {
  const held = composition.entries.some(
    (entry) => entry.section === "mainDeck" && entry.cardId === champion.cardId,
  );

  return held
    ? []
    : [
        {
          type: "cardConstraint",
          cardId: champion.cardId,
          printingIds: [],
          rule: { kind: "championInMainDeck" },
          message: "Your Chosen Champion has to be one of the main deck's cards.",
        },
      ];
}

function sectionViolations(
  composition: DeckComposition,
  rule: SectionRule,
): readonly DeckLegalityViolation[] {
  const violations: DeckLegalityViolation[] = [];
  const total = sectionTotal(composition, rule.section);

  if (total !== rule.requiredCount) {
    violations.push({
      type: "deckConstraint",
      rule: { kind: "sectionSize", section: rule.section },
      message: `${rule.label} needs exactly ${rule.requiredCount} cards. You have ${total}.`,
    });
  }

  return [...violations, ...sectionCopyViolations(composition, rule)];
}

function sectionCopyViolations(
  composition: DeckComposition,
  rule: SectionRule,
): readonly DeckLegalityViolation[] {
  return match(rule.section)
    .with("legend", "mainDeck", "sideboard", (): readonly DeckLegalityViolation[] => [])
    .with("runeDeck", "battlefield", () => sectionAllowanceViolations(composition, rule))
    .exhaustive();
}

function sectionAllowanceViolations(
  composition: DeckComposition,
  rule: SectionRule,
): readonly DeckLegalityViolation[] {
  return match(rule.copyAllowance)
    .with({ type: "unlimited" }, (): readonly DeckLegalityViolation[] => [])
    .with({ type: "limited" }, ({ copies }): readonly DeckLegalityViolation[] =>
      [...copiesByCard(composition, [rule.section])]
        .filter(([, held]) => held.copies > copies)
        .map(([cardId, held]) => ({
          type: "cardConstraint" as const,
          cardId,
          printingIds: held.printingIds,
          rule: { kind: "sectionCopyLimit" as const, section: rule.section },
          message: `${rule.label} allows ${copiesLabel(copies)} of a card. This one has ${held.copies}.`,
        })),
    )
    .exhaustive();
}

function sharedCopyViolations(composition: DeckComposition): readonly DeckLegalityViolation[] {
  return [...copiesByCard(composition, SHARED_COPY_SECTIONS)]
    .filter(([, held]) => held.copies > SHARED_COPY_LIMIT)
    .map(([cardId, held]) => ({
      type: "cardConstraint" as const,
      cardId,
      printingIds: held.printingIds,
      rule: { kind: "sharedCopyLimit" },
      message: `Main deck and sideboard share a limit of ${SHARED_COPY_LIMIT} copies. This card has ${held.copies}.`,
    }));
}

function sectionTotal(composition: DeckComposition, section: DeckSection): number {
  return composition.entries
    .filter((entry) => entry.section === section)
    .reduce((total, entry) => total + entry.quantity, 0);
}

function copiesLabel(limit: number): string {
  return limit === 1 ? "one copy" : `${limit} copies`;
}

export {
  CHAMPION_UNIT,
  COUNTED_SECTION_RULES,
  isChampionUnit,
  limitedCopies,
  narrowerAllowance,
  remainingCopies,
  RIFTBOUND_STANDARD,
  sectionRule,
  UNLIMITED_COPIES,
  verifyDeck,
};
export type { CopyAllowance, SectionRule };
