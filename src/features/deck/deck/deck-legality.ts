import { match, P } from "ts-pattern";
import { z } from "zod/v4";

import type { CardId } from "@/features/card/value-objects/card-id";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

import {
  deckSectionSchema,
  parseDeckVerification,
  type DeckContents,
  type DeckLegalityViolation,
  type DeckSection,
  type DeckVerification,
  type TournamentRuleset,
} from "./deck";

const copyAllowanceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("limited"), copies: z.number().int().nonnegative() }),
  z.object({ type: z.literal("unlimited") }),
]);

const zoneSectionSchema = deckSectionSchema.extract([
  "mainDeck",
  "runeDeck",
  "battlefield",
  "sideboard",
]);

type CopyAllowance = z.output<typeof copyAllowanceSchema>;
type ZoneSection = z.output<typeof zoneSectionSchema>;

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

/** How many cards a zone must hold, and how many copies of one card it will take. */
interface ZoneRule {
  readonly section: ZoneSection;
  readonly label: string;
  readonly requiredCount: number;
  readonly copyAllowance: CopyAllowance;
}

const ZONE_RULES_BY_SECTION: Readonly<Record<ZoneSection, ZoneRule>> = {
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

const ZONE_RULES: readonly ZoneRule[] = [
  ZONE_RULES_BY_SECTION.mainDeck,
  ZONE_RULES_BY_SECTION.runeDeck,
  ZONE_RULES_BY_SECTION.battlefield,
  ZONE_RULES_BY_SECTION.sideboard,
];

function zoneRule(section: ZoneSection): ZoneRule {
  return ZONE_RULES_BY_SECTION[section];
}

/**
 * Three copies of a name in total across the main deck and the sideboard, so a card cannot hide
 * extra copies in one of them.
 */
const SHARED_COPY_LIMIT = 3;
const SHARED_COPY_SECTIONS: readonly DeckSection[] = ["mainDeck", "sideboard"];

const LEGEND_ALLOWANCE: CopyAllowance = { type: "limited", copies: 1 };

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
    .with("legend", () => LEGEND_ALLOWANCE)
    .with("mainDeck", "sideboard", () => limitedCopies(SHARED_COPY_LIMIT))
    .with("runeDeck", "battlefield", (zone) => zoneRule(zone).copyAllowance)
    .exhaustive();
}

/** Copies of a card already held in the sections that share this one's allowance. */
function copiesHeldElsewhere(
  contents: DeckContents,
  section: DeckSection,
  cardId: CardId,
  printingId: PrintingId,
): number {
  const sharing = sectionsSharingAllowance(section);

  return contents.entries
    .filter(
      (entry) =>
        entry.cardId === cardId &&
        sharing.includes(entry.section) &&
        !(entry.section === section && entry.printingId === printingId),
    )
    .reduce((total, entry) => total + entry.quantity, 0);
}

function remainingCopies(
  contents: DeckContents,
  section: DeckSection,
  cardId: CardId,
  printingId: PrintingId,
): CopyAllowance {
  return remainingAllowance(
    copyAllowance(section),
    copiesHeldElsewhere(contents, section, cardId, printingId),
  );
}

function copiesByCard(
  contents: DeckContents,
  sections: readonly DeckSection[],
): Map<CardId, HeldCopies> {
  const held = new Map<CardId, HeldCopies>();

  for (const entry of contents.entries) {
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

function verifyDeck(contents: DeckContents, ruleset: TournamentRuleset): DeckVerification {
  const violations = [
    ...singletonViolations(contents, "legend", "Legend"),
    ...championViolations(contents),
    ...ZONE_RULES.flatMap((rule) => zoneViolations(contents, rule)),
    ...sharedCopyViolations(contents),
  ];

  return parseDeckVerification(
    violations.length === 0 ? { type: "legal", ruleset } : { type: "illegal", ruleset, violations },
  );
}

/** The legend and the chosen champion are each exactly one card, outside every other count. */
function singletonViolations(
  contents: DeckContents,
  section: DeckSection,
  label: string,
): readonly DeckLegalityViolation[] {
  const total = sectionTotal(contents, section);

  if (total === 1) return [];

  return [
    {
      type: "deckConstraint",
      rule: { kind: "sectionRequired", section },
      message: total === 0 ? `Pick a ${label}.` : `A deck has one ${label}, not ${total}.`,
    },
  ];
}

/** The chosen champion is a main deck card, so the deck has to actually hold a copy of it. */
function championViolations(contents: DeckContents): readonly DeckLegalityViolation[] {
  const cardId = contents.chosenChampionCardId;

  if (cardId === null) {
    return [
      {
        type: "deckConstraint",
        rule: { kind: "championRequired" },
        message: "Pick a Chosen Champion.",
      },
    ];
  }

  const held = contents.entries.some(
    (entry) => entry.section === "mainDeck" && entry.cardId === cardId,
  );

  return held
    ? []
    : [
        {
          type: "cardConstraint",
          cardId,
          printingIds: [],
          rule: { kind: "championInMainDeck" },
          message: "Your Chosen Champion has to be one of the main deck's cards.",
        },
      ];
}

function zoneViolations(contents: DeckContents, rule: ZoneRule): readonly DeckLegalityViolation[] {
  const violations: DeckLegalityViolation[] = [];
  const total = sectionTotal(contents, rule.section);

  if (total !== rule.requiredCount) {
    violations.push({
      type: "deckConstraint",
      rule: { kind: "sectionSize", section: rule.section },
      message: `${rule.label} needs exactly ${rule.requiredCount} cards. You have ${total}.`,
    });
  }

  return [...violations, ...zoneCopyViolations(contents, rule)];
}

function zoneCopyViolations(
  contents: DeckContents,
  rule: ZoneRule,
): readonly DeckLegalityViolation[] {
  return match(rule.section)
    .with("mainDeck", "sideboard", (): readonly DeckLegalityViolation[] => [])
    .with("runeDeck", "battlefield", () => zoneAllowanceViolations(contents, rule))
    .exhaustive();
}

function zoneAllowanceViolations(
  contents: DeckContents,
  rule: ZoneRule,
): readonly DeckLegalityViolation[] {
  return match(rule.copyAllowance)
    .with({ type: "unlimited" }, (): readonly DeckLegalityViolation[] => [])
    .with({ type: "limited" }, ({ copies }): readonly DeckLegalityViolation[] =>
      [...copiesByCard(contents, [rule.section])]
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

function sharedCopyViolations(contents: DeckContents): readonly DeckLegalityViolation[] {
  return [...copiesByCard(contents, SHARED_COPY_SECTIONS)]
    .filter(([, held]) => held.copies > SHARED_COPY_LIMIT)
    .map(([cardId, held]) => ({
      type: "cardConstraint" as const,
      cardId,
      printingIds: held.printingIds,
      rule: { kind: "sharedCopyLimit" },
      message: `Main deck and sideboard share a limit of ${SHARED_COPY_LIMIT} copies. This card has ${held.copies}.`,
    }));
}

function sectionTotal(contents: DeckContents, section: DeckSection): number {
  return contents.entries
    .filter((entry) => entry.section === section)
    .reduce((total, entry) => total + entry.quantity, 0);
}

function copiesLabel(limit: number): string {
  return limit === 1 ? "one copy" : `${limit} copies`;
}

export {
  copyAllowance,
  limitedCopies,
  narrowerAllowance,
  remainingAllowance,
  remainingCopies,
  RIFTBOUND_STANDARD,
  sectionsSharingAllowance,
  UNLIMITED_COPIES,
  verifyDeck,
  ZONE_RULES,
  zoneRule,
};
export type { CopyAllowance, ZoneRule, ZoneSection };
