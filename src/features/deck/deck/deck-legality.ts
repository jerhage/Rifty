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
      rule: `${section}-required`,
      message: total === 0 ? `Pick a ${label}.` : `A deck has one ${label}, not ${total}.`,
    },
  ];
}

/** The chosen champion is a main deck card, so the deck has to actually hold a copy of it. */
function championViolations(deck: Deck): readonly DeckLegalityViolation[] {
  const cardRiftboundId = deck.chosenChampionRiftboundId;

  if (cardRiftboundId === null) {
    return [
      {
        type: "deckConstraint",
        rule: "chosenChampion-required",
        message: "Pick a Chosen Champion.",
      },
    ];
  }

  const held = deck.entries.some(
    (entry) => entry.section === "mainDeck" && entry.cardRiftboundId === cardRiftboundId,
  );

  return held
    ? []
    : [
        {
          type: "cardConstraint",
          cardRiftboundId,
          rule: "chosenChampion-in-main-deck",
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
      rule: `${rule.section}-size`,
      message: `${rule.label} needs exactly ${rule.requiredCount} cards. You have ${total}.`,
    });
  }

  if (rule.copyLimit !== null && !SHARED_COPY_SECTIONS.includes(rule.section)) {
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
    if (!SHARED_COPY_SECTIONS.includes(entry.section)) continue;

    copiesByCard.set(
      entry.cardRiftboundId,
      (copiesByCard.get(entry.cardRiftboundId) ?? 0) + entry.quantity,
    );
  }

  return [...copiesByCard]
    .filter(([, copies]) => copies > SHARED_COPY_LIMIT)
    .map(([cardRiftboundId, copies]) => ({
      type: "cardConstraint" as const,
      cardRiftboundId,
      rule: "shared-copy-limit",
      message: `Main deck and sideboard share a limit of ${SHARED_COPY_LIMIT} copies. This card has ${copies}.`,
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
