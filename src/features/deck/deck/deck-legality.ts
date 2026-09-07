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

/** The main deck and sideboard share one allowance, so a card cannot hide extra copies in either. */
const sharedCopyLimit = 3;
const sharedCopySections: readonly DeckSection[] = ["mainDeck", "sideboard"];

const riftboundStandard: TournamentRuleset = {
  id: "riftbound-standard",
  format: "Standard",
  version: "2026.1",
};

function verifyDeck(deck: Deck, ruleset: TournamentRuleset): DeckVerification {
  const violations = [
    ...singletonViolations(deck, "legend", "Legend"),
    ...singletonViolations(deck, "chosenChampion", "Chosen Champion"),
    ...chosenChampionViolations(deck),
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

function chosenChampionViolations(deck: Deck): readonly DeckLegalityViolation[] {
  const champion = deck.entries.find((entry) => entry.section === "chosenChampion");

  if (!champion) return [];

  const inMainDeck = deck.entries.some(
    (entry) => entry.section === "mainDeck" && entry.cardRiftboundId === champion.cardRiftboundId,
  );

  return inMainDeck
    ? []
    : [
        {
          type: "cardConstraint",
          cardRiftboundId: champion.cardRiftboundId,
          rule: "chosen-champion-in-main-deck",
          message: "Your Chosen Champion also has to be in the main deck.",
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

function copiesLabel(limit: number): string {
  return limit === 1 ? "one copy" : `${limit} copies`;
}

export { riftboundStandard, verifyDeck, zoneRules };
export type { ZoneRule };
