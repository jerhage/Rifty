import {
  parseDeckVerification,
  type CardRiftboundId,
  type Deck,
  type DeckLegalityViolation,
  type DeckSection,
  type DeckVerification,
  type TournamentRuleset,
} from "./deck";

/** How many cards a zone must hold, and how many copies of one card it will take. */
interface ZoneRule {
  readonly section: DeckSection;
  readonly label: string;
  readonly requiredCount: number;
  /** `null` where a zone places no limit on copies, as the rune deck does not. */
  readonly copyLimit: number | null;
}

const zoneRules: readonly ZoneRule[] = [
  { section: "mainDeck", label: "Main deck", requiredCount: 40, copyLimit: 3 },
  { section: "runeDeck", label: "Rune deck", requiredCount: 12, copyLimit: null },
  { section: "battlefield", label: "Battlefields", requiredCount: 3, copyLimit: 1 },
  { section: "sideboard", label: "Sideboard", requiredCount: 10, copyLimit: 3 },
];

/**
 * Three copies of a name in total across the champion zone, the main deck and the sideboard, so
 * a card cannot hide extra copies in one of them.
 */
const sharedCopyLimit = 3;
const sharedCopySections: readonly DeckSection[] = ["chosenChampion", "mainDeck", "sideboard"];

const riftboundStandard: TournamentRuleset = {
  id: "riftbound-standard",
  format: "Standard",
  version: "2026.1",
};

/** Sections whose copies of a card count against the same allowance as `section`. */
function sectionsSharingAllowance(section: DeckSection): readonly DeckSection[] {
  return sharedCopySections.includes(section) ? sharedCopySections : [section];
}

function copyAllowance(section: DeckSection): number | null {
  if (sharedCopySections.includes(section)) return sharedCopyLimit;

  const rule = zoneRules.find((candidate) => candidate.section === section);

  // A zone with no rule is the legend, which is a singleton. `null` on a rule means no limit at
  // all, so it must not collapse into a default of one.
  return rule ? rule.copyLimit : 1;
}

/** Copies of a card already held in the sections that share this one's allowance. */
function copiesHeldElsewhere(
  deck: Deck,
  section: DeckSection,
  cardRiftboundId: CardRiftboundId,
): number {
  const sharing = sectionsSharingAllowance(section);

  return deck.entries
    .filter(
      (entry) =>
        entry.cardRiftboundId === cardRiftboundId &&
        entry.section !== section &&
        sharing.includes(entry.section),
    )
    .reduce((total, entry) => total + entry.quantity, 0);
}

/** How many more copies this section will take, or `null` where the zone sets no limit. */
function remainingCopies(
  deck: Deck,
  section: DeckSection,
  cardRiftboundId: CardRiftboundId,
): number | null {
  const allowance = copyAllowance(section);

  if (allowance === null) return null;

  return Math.max(0, allowance - copiesHeldElsewhere(deck, section, cardRiftboundId));
}

function verifyDeck(deck: Deck, ruleset: TournamentRuleset): DeckVerification {
  const violations = [
    ...singletonViolations(deck, "legend", "Legend"),
    ...singletonViolations(deck, "chosenChampion", "Chosen Champion"),
    ...zoneRules.flatMap((rule) => zoneViolations(deck, rule)),
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
      rule: `${section}-required`,
      message: total === 0 ? `Pick a ${label}.` : `A deck has one ${label}, not ${total}.`,
    },
  ];
}

function zoneViolations(deck: Deck, rule: ZoneRule): readonly DeckLegalityViolation[] {
  const violations: DeckLegalityViolation[] = [];
  const total = zoneTotal(deck, rule.section);

  if (total !== rule.requiredCount) {
    violations.push({
      type: "deckConstraint",
      rule: `${rule.section}-size`,
      message: `${rule.label} needs exactly ${rule.requiredCount} cards. You have ${total}.`,
    });
  }

  if (rule.copyLimit !== null && !sharedCopySections.includes(rule.section)) {
    for (const entry of deck.entries) {
      if (entry.section !== rule.section || entry.quantity <= rule.copyLimit) continue;

      violations.push({
        type: "cardConstraint",
        cardRiftboundId: entry.cardRiftboundId,
        rule: `${rule.section}-copy-limit`,
        message: `${rule.label} allows ${copiesLabel(rule.copyLimit)} of a card. This one has ${entry.quantity}.`,
      });
    }
  }

  return violations;
}

function sharedCopyViolations(deck: Deck): readonly DeckLegalityViolation[] {
  const copiesByCard = new Map<CardRiftboundId, number>();

  for (const entry of deck.entries) {
    if (!sharedCopySections.includes(entry.section)) continue;

    copiesByCard.set(
      entry.cardRiftboundId,
      (copiesByCard.get(entry.cardRiftboundId) ?? 0) + entry.quantity,
    );
  }

  return [...copiesByCard]
    .filter(([, copies]) => copies > sharedCopyLimit)
    .map(([cardRiftboundId, copies]) => ({
      type: "cardConstraint" as const,
      cardRiftboundId,
      rule: "shared-copy-limit",
      message: `Main deck and sideboard share a limit of ${sharedCopyLimit} copies. This card has ${copies}.`,
    }));
}

function sectionTotal(deck: Deck, section: DeckSection): number {
  return deck.entries
    .filter((entry) => entry.section === section)
    .reduce((total, entry) => total + entry.quantity, 0);
}

/**
 * The chosen champion starts in its own zone but occupies one of the main deck's forty, so the
 * main deck's size counts it.
 */
function zoneTotal(deck: Deck, section: DeckSection): number {
  const own = sectionTotal(deck, section);

  return section === "mainDeck" ? own + sectionTotal(deck, "chosenChampion") : own;
}

function copiesLabel(limit: number): string {
  return limit === 1 ? "one copy" : `${limit} copies`;
}

export { copyAllowance, remainingCopies, riftboundStandard, verifyDeck, zoneRules, zoneTotal };
export type { ZoneRule };
