import type { CardId } from "@/features/card/value-objects/card-id";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

import {
  parseDeckVerification,
  type Deck,
  type DeckLegalityViolation,
  type DeckSection,
  type DeckVerification,
  type TournamentRuleset,
} from "./deck";

interface HeldCopies {
  readonly copies: number;
  readonly printingIds: PrintingId[];
}

/** How many cards a zone must hold, and how many copies of one card it will take. */
interface ZoneRule {
  readonly section: DeckSection;
  readonly label: string;
  readonly requiredCount: number;
  /** `null` where a zone places no limit on copies, as the rune deck does not. */
  readonly copyLimit: number | null;
}

const ZONE_RULES: readonly ZoneRule[] = [
  { section: "mainDeck", label: "Main deck", requiredCount: 40, copyLimit: 3 },
  { section: "runeDeck", label: "Rune deck", requiredCount: 12, copyLimit: null },
  { section: "battlefield", label: "Battlefields", requiredCount: 3, copyLimit: 1 },
  { section: "sideboard", label: "Sideboard", requiredCount: 10, copyLimit: 3 },
];

/**
 * Three copies of a name in total across the main deck and the sideboard, so a card cannot hide
 * extra copies in one of them.
 */
const SHARED_COPY_LIMIT = 3;
const SHARED_COPY_SECTIONS: readonly DeckSection[] = ["mainDeck", "sideboard"];

const RIFTBOUND_STANDARD: TournamentRuleset = {
  id: "riftbound-standard",
  format: "Standard",
  version: "2026.1",
};

/** Sections whose copies of a card count against the same allowance as `section`. */
function sectionsSharingAllowance(section: DeckSection): readonly DeckSection[] {
  return SHARED_COPY_SECTIONS.includes(section) ? SHARED_COPY_SECTIONS : [section];
}

function copyAllowance(section: DeckSection): number | null {
  if (SHARED_COPY_SECTIONS.includes(section)) return SHARED_COPY_LIMIT;

  const rule = ZONE_RULES.find((candidate) => candidate.section === section);

  // A zone with no rule is the legend, which is a singleton. `null` on a rule means no limit at
  // all, so it must not collapse into a default of one.
  return rule ? rule.copyLimit : 1;
}

/** Copies of a card already held in the sections that share this one's allowance. */
function copiesHeldElsewhere(
  deck: Deck,
  section: DeckSection,
  cardId: CardId,
  printingId: PrintingId,
): number {
  const sharing = sectionsSharingAllowance(section);

  return deck.entries
    .filter(
      (entry) =>
        entry.cardId === cardId &&
        sharing.includes(entry.section) &&
        !(entry.section === section && entry.printingId === printingId),
    )
    .reduce((total, entry) => total + entry.quantity, 0);
}

/** How many more copies this section will take, or `null` where the zone sets no limit. */
function remainingCopies(
  deck: Deck,
  section: DeckSection,
  cardId: CardId,
  printingId: PrintingId,
): number | null {
  const allowance = copyAllowance(section);

  if (allowance === null) return null;

  return Math.max(0, allowance - copiesHeldElsewhere(deck, section, cardId, printingId));
}

function copiesByCard(deck: Deck, sections: readonly DeckSection[]): Map<CardId, HeldCopies> {
  const held = new Map<CardId, HeldCopies>();

  for (const entry of deck.entries) {
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

function verifyDeck(deck: Deck, ruleset: TournamentRuleset): DeckVerification {
  const violations = [
    ...singletonViolations(deck, "legend", "Legend"),
    ...championViolations(deck),
    ...ZONE_RULES.flatMap((rule) => zoneViolations(deck, rule)),
    ...sharedCopyViolations(deck),
  ];

  return parseDeckVerification(
    violations.length === 0
      ? { type: "legal", deck, ruleset }
      : { type: "illegal", deck, ruleset, violations },
  );
}

/** The legend and the chosen champion are each exactly one card, outside every other count. */
function singletonViolations(
  deck: Deck,
  section: DeckSection,
  label: string,
): readonly DeckLegalityViolation[] {
  const total = sectionTotal(deck, section);

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
function championViolations(deck: Deck): readonly DeckLegalityViolation[] {
  const cardId = deck.chosenChampionCardId;

  if (cardId === null) {
    return [
      {
        type: "deckConstraint",
        rule: { kind: "championRequired" },
        message: "Pick a Chosen Champion.",
      },
    ];
  }

  const held = deck.entries.some(
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

function zoneViolations(deck: Deck, rule: ZoneRule): readonly DeckLegalityViolation[] {
  const violations: DeckLegalityViolation[] = [];
  const total = sectionTotal(deck, rule.section);

  if (total !== rule.requiredCount) {
    violations.push({
      type: "deckConstraint",
      rule: { kind: "sectionSize", section: rule.section },
      message: `${rule.label} needs exactly ${rule.requiredCount} cards. You have ${total}.`,
    });
  }

  if (rule.copyLimit !== null && !SHARED_COPY_SECTIONS.includes(rule.section)) {
    for (const [cardId, held] of copiesByCard(deck, [rule.section])) {
      if (held.copies <= rule.copyLimit) continue;

      violations.push({
        type: "cardConstraint",
        cardId,
        printingIds: held.printingIds,
        rule: { kind: "sectionCopyLimit", section: rule.section },
        message: `${rule.label} allows ${copiesLabel(rule.copyLimit)} of a card. This one has ${held.copies}.`,
      });
    }
  }

  return violations;
}

function sharedCopyViolations(deck: Deck): readonly DeckLegalityViolation[] {
  return [...copiesByCard(deck, SHARED_COPY_SECTIONS)]
    .filter(([, held]) => held.copies > SHARED_COPY_LIMIT)
    .map(([cardId, held]) => ({
      type: "cardConstraint" as const,
      cardId,
      printingIds: held.printingIds,
      rule: { kind: "sharedCopyLimit" },
      message: `Main deck and sideboard share a limit of ${SHARED_COPY_LIMIT} copies. This card has ${held.copies}.`,
    }));
}

function sectionTotal(deck: Deck, section: DeckSection): number {
  return deck.entries
    .filter((entry) => entry.section === section)
    .reduce((total, entry) => total + entry.quantity, 0);
}

function copiesLabel(limit: number): string {
  return limit === 1 ? "one copy" : `${limit} copies`;
}

export { copyAllowance, remainingCopies, RIFTBOUND_STANDARD, verifyDeck, ZONE_RULES };
export type { ZoneRule };
