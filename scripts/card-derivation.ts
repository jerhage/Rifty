import { match } from "ts-pattern";

import type { PrintingFinish } from "../src/features/card/value-objects/printing-finish";

type CardSpeed = "normal" | "action" | "reaction";
type KeywordTargetKind =
  | "self"
  | "unit"
  | "gear"
  | "spell"
  | "card"
  | "player"
  | "effect"
  | "cost"
  | "rule";
type KeywordAllegiance = "own" | "friendly" | "enemy" | "any_player" | "unspecified";

interface KeywordTarget {
  readonly kind: KeywordTargetKind;
  readonly isToken: boolean;
  readonly allegiance: KeywordAllegiance;
}

type TargetPhrase =
  | {
      readonly type: "leadIn";
      readonly leadIn: RegExp;
      readonly targets: readonly KeywordTarget[];
    }
  | {
      readonly type: "trailing";
      readonly trailing: RegExp;
      readonly targets: readonly KeywordTarget[];
    }
  | {
      readonly type: "surrounding";
      readonly leadIn: RegExp;
      readonly trailing: RegExp;
      readonly targets: readonly KeywordTarget[];
    };

type KeywordTargeting =
  | { readonly type: "targeted"; readonly targets: readonly KeywordTarget[] }
  | { readonly type: "unclassified"; readonly leadIn: string; readonly trailing: string };

interface OwnedKeyword {
  readonly id: string;
  readonly name: string;
  readonly value: number | null;
  readonly cost: string | null;
}

interface KeywordOccurrence extends OwnedKeyword {
  readonly targeting: KeywordTargeting;
}

interface PrintingIdentity {
  readonly poolCode: string | null;
  readonly collectorNumber: string | null;
}

interface PrintingRelease {
  readonly setCode: string;
  readonly collectorNumber: string;
  readonly poolCode: string | null;
  readonly finish: PrintingFinish;
}

interface FeedFinishFlags {
  readonly alternateArt: boolean;
  readonly overnumbered: boolean;
  readonly signature: boolean;
}

const LEADING_RUN = /^\s*(?:\[[^\]]+\]\s*(?:\([^)]*\)\s*)?)+/;
const BRACKET_TOKEN = /\[([^\]]+)\]/g;
const REMINDER = /\([^()]*\)/g;
const TRAILING_COST = /^[ \t]*(?::rb_[a-z0-9_]+:[ \t]*)+/;
const COORDINATED_TAIL =
  /(?:[ \t_]+|\band\b|\bor\b|\[[^\]]*\]|\([^()]*\)|:rb_[a-z0-9_]+:|[+-]?\d+|(?<=[\]):\d][ \t_]{0,4}),)$/;
const MAGNITUDE = /^(.+?)\s+(\d+)$/;
const ARROW = /^(?:&(?:amp;)?gt;|>)+$/;
const SYMBOL = /:rb_[a-z0-9_]+:/g;
const DIGITS_ONLY = /^\d+$/;
const LEVEL = /^level\s+\d+$/i;
const PLACEHOLDER = new Set(["no text"]);
const SPEED_ORDER: readonly CardSpeed[] = ["normal", "action", "reaction"];
const NAME_SEPARATOR = /\s+-\s+|,\s+/;
const ELIDED_APOSTROPHE = /(?<=[\p{L}\p{N}])'(?=[\p{L}\p{N}])/gu;
const SEPARATOR_RUN = /(?:(?<![\p{L}\p{N}])[^\p{L}\p{N}]|[^\p{L}\p{N}](?![\p{L}\p{N}]))+/gu;
const NAME_QUALIFIER = /\s*\([^)]*\)\s*$/;
const TRAILING_PARENTHETICAL = /\(([^()]*)\)\s*$/;
const FINISH_BY_LABEL: Readonly<Record<string, PrintingFinish>> = {
  "Alternate Art": "alternateArt",
  Overnumbered: "overnumbered",
  Signature: "signature",
  Metal: "metal",
  "Metal Deluxe": "metalDeluxe",
  "Summoner Circle": "summonerCircle",
  Champion: "champion",
  Starter: "starter",
  "Launch Exclusive": "launchExclusive",
  Ultimate: "ultimate",
  NX: "nx",
};
const FINISH_ID_SEGMENTS: Readonly<Record<PrintingFinish, readonly string[]>> = {
  standard: [],
  alternateArt: ["alternate-art"],
  overnumbered: ["overnumbered"],
  signature: ["signature"],
  metal: ["metal"],
  metalDeluxe: ["metal-deluxe"],
  summonerCircle: ["summoner-circle"],
  champion: ["champion"],
  starter: ["starter"],
  launchExclusive: ["launch-exclusive"],
  ultimate: ["ultimate"],
  nx: ["nx"],
};
const CANONICAL_SEPARATOR = ", ";
const APOSTROPHE_VARIANT = /[\u2018\u2019\u02bc\u2032]/g;
const QUOTE_VARIANT = /[\u201c\u201d\u2033]/g;
const DASH_VARIANT = /[\u2010-\u2015\u2212]/g;
const WHITESPACE_RUN = /\s+/g;
const LINE_BREAK = /\r?\n/;
const TRAILING_WINDOW = 40;

const ABILITY_OPENER = /(?:^|[\n.;:—–]|&quot;|")$/;
const CONTROLLER_KEYWORDS = new Set(["add", "burn", "predict"]);
const GAINED_KEYWORDS = new Set(["add"]);
const QUOTE = /&quot;|"/g;

function on(kind: KeywordTargetKind, allegiance: KeywordAllegiance): KeywordTarget {
  return { kind, isToken: false, allegiance };
}

function onToken(kind: KeywordTargetKind, allegiance: KeywordAllegiance): KeywordTarget {
  return { kind, isToken: true, allegiance };
}

const SELF = on("self", "own");
const OWN_PLAYER = on("player", "own");
const ENEMY_PLAYER = on("player", "enemy");
const ANY_PLAYER = on("player", "any_player");
const FRIENDLY_UNIT = on("unit", "friendly");
const ENEMY_UNIT = on("unit", "enemy");
const ANY_UNIT = on("unit", "unspecified");
const FRIENDLY_UNIT_TOKEN = onToken("unit", "friendly");
const FRIENDLY_GEAR = on("gear", "friendly");
const ENEMY_GEAR = on("gear", "enemy");
const ANY_GEAR = on("gear", "unspecified");
const FRIENDLY_GEAR_TOKEN = onToken("gear", "friendly");
const FRIENDLY_SPELL = on("spell", "friendly");
const ANY_SPELL = on("spell", "unspecified");
const ENEMY_CARD = on("card", "enemy");
const ANY_CARD = on("card", "unspecified");
const FRIENDLY_EFFECT = on("effect", "friendly");
const FRIENDLY_COST = on("cost", "friendly");
const KEYWORD_RULE = on("rule", "unspecified");

function before(leadIn: RegExp, ...targets: readonly KeywordTarget[]): TargetPhrase {
  return { type: "leadIn", leadIn, targets };
}

function after(trailing: RegExp, ...targets: readonly KeywordTarget[]): TargetPhrase {
  return { type: "trailing", trailing, targets };
}

function around(
  leadIn: RegExp,
  trailing: RegExp,
  ...targets: readonly KeywordTarget[]
): TargetPhrase {
  return { type: "surrounding", leadIn, trailing, targets };
}

const ACTOR_LEAD_INS: readonly TargetPhrase[] = [
  before(/\bthe attacker and defender each$/i, OWN_PLAYER, ENEMY_PLAYER),
  before(/\bchoose an opponent\. they$/i, ENEMY_PLAYER),
  before(/\bthey$/i, ANY_PLAYER),
  before(/\bthey (?:may|can|must)$/i, ANY_PLAYER),
  before(/\beach player$/i, ANY_PLAYER),
];

const SELF_LEAD_INS: readonly TargetPhrase[] = [
  before(/\bI have$/i, SELF),
  before(/\bI gain$/i, SELF),
  before(/\bI get$/i, SELF),
  before(/\bI keep$/i, SELF),
  before(/\bI['\u2019]m$/i, SELF),
  before(/\bI am$/i, SELF),
  before(/\bI was$/i, SELF),
  before(/\bI become$/i, SELF),
  before(/\bI can be$/i, SELF),
  before(/\bgives? me$/i, SELF),
  before(/\bto me$/i, SELF),
  before(/\bmy$/i, SELF),
  before(/\bif this is$/i, SELF),
];

const TARGET_LEAD_INS: readonly TargetPhrase[] = [
  around(/\byour$/i, /^[ \t]+effects?\b/i, FRIENDLY_EFFECT),
  around(/\bfriendly$/i, /^[ \t]+costs?\b/i, FRIENDLY_COST),
  around(/\byour opponents['\u2019]$/i, /^[ \t]+cards?\b/i, ENEMY_CARD),
  around(/\bwhen you play a$/i, /^[ \t]+units?\b/i, ANY_UNIT),
  around(/\bfor each of your$/i, /^[ \t]+units?\b/i, FRIENDLY_UNIT),
  around(/\bkill a friendly$/i, /^[ \t]+units?\b/i, FRIENDLY_UNIT),
  around(/\bone or more$/i, /^[ \t]+units?\b/i, ANY_UNIT),
  before(/\b(?:players? )?ignores?$/i, KEYWORD_RULE),
  before(/\bother friendly units here have$/i, FRIENDLY_UNIT),
  before(/\bfriendly (?:buffed )?units(?: [\w'\u2019-]+)* have$/i, FRIENDLY_UNIT),
  before(/\bunits here(?: with \[[^\]]*\])? (?:have|with)$/i, ANY_UNIT),
  before(/\byour token units have$/i, FRIENDLY_UNIT_TOKEN),
  before(/\byour (?:other )?units (?:here )?have$/i, FRIENDLY_UNIT),
  before(/\byour (?:mechs|sand soldiers) (?:each )?have$/i, FRIENDLY_UNIT),
  before(/\bsand soldiers you play have$/i, FRIENDLY_UNIT),
  before(/\byour units that are$/i, FRIENDLY_UNIT),
  before(/\byour equipment (?:everywhere have|each gives?)$/i, FRIENDLY_GEAR),
  before(/\byour spells have$/i, FRIENDLY_SPELL),
  before(/\b(?:each |two |up to two )?(?:unit|gear) tokens? with$/i, FRIENDLY_UNIT_TOKEN),
  before(/\b(?:your |a |an |each |two |up to two )?cards? with$/i, ANY_CARD),
  before(/\bspells? with$/i, ANY_SPELL),
  before(/\b(?:a friendly|your|friendly) units? with(?:out)?$/i, FRIENDLY_UNIT),
  before(/\bunits? with(?:out)?$/i, ANY_UNIT),
  before(/\b(?:one of )?(?:your units|a unit you control) becomes$/i, FRIENDLY_UNIT),
  before(/\ban enemy gear\. if it['\u2019]s$/i, ENEMY_GEAR),
  before(/\bcontrol something that['\u2019]s$/i, ANY_CARD),
  before(/\bgives? (?:it|them|him|her|those|these)$/i, ANY_UNIT),
  before(/\bit (?:gains?|gets?)$/i, ANY_UNIT),
  before(
    /\bgives? (?:one of )?(?:your|their|his|her)(?: [\w'\u2019-]+)* units?(?: here| there)?$/i,
    FRIENDLY_UNIT,
  ),
  before(/\bgives? an? friendly unit$/i, FRIENDLY_UNIT),
  before(/\bgives? an? unit(?: at a battlefield)?$/i, ANY_UNIT),
  before(/\ban? gear$/i, ANY_GEAR),
  before(/\bgives? (?:the|your) next spell(?: you play)?(?: this turn)?$/i, FRIENDLY_SPELL),
  before(/\bgives? an? spell in your trash$/i, FRIENDLY_SPELL),
  before(/\bplay a card from$/i, ANY_CARD),
  before(/\bI['\u2019]m played from$/i, ANY_CARD),
  before(/\b(?:a|an|the|each|every|any|another) units? that['\u2019]s$/i, ANY_UNIT),
  before(/\bif (?:it|that|they|he|she)(?:['\u2019]s|['\u2019]re| is| are| was| were)?$/i, ANY_UNIT),
  before(/\bif at least one of them has$/i, ANY_UNIT),
];

const SELF_TRAILING_TARGETS: readonly TargetPhrase[] = [after(/^[ \t]+(?:me|my|myself)\b/i, SELF)];

const TARGET_TRAILING_TARGETS: readonly TargetPhrase[] = [
  after(
    /^[ \t]+(?:an?|the|one|each|every|any|all)?[ \t]*(?:attacking |defending |stunned )?enemy units?\b/i,
    ENEMY_UNIT,
  ),
  after(/^[ \t]+(?:an?|the|one|each|every|any|all)?[ \t]*friendly units?\b/i, FRIENDLY_UNIT),
  after(/^[ \t]+(?:an?|the|one|each|every|any|all)?[ \t]*units?\b/i, ANY_UNIT),
  after(/^[ \t]+(?:an?|the|one|each|every|any|all)?[ \t]*(?:gears?|equipment)\b/i, ANY_GEAR),
  after(/^[ \t]+(?:it|them|him|her|those|these|they)\b/i, ANY_UNIT),
  after(/^[ \t]+(?:an?|the|all|each|every|any|another)\b/i, ANY_UNIT),
];

const CLASSIFIED_PHRASES: readonly TargetPhrase[] = [
  ...SELF_LEAD_INS,
  ...TARGET_LEAD_INS,
  ...SELF_TRAILING_TARGETS,
  ...TARGET_TRAILING_TARGETS,
];

const GRANTED_BEARERS: readonly (readonly [RegExp, KeywordTarget])[] = [
  [/\bunit tokens?\b/gi, FRIENDLY_UNIT_TOKEN],
  [/\bgear tokens?\b/gi, FRIENDLY_GEAR_TOKEN],
];

function leadingTokens(text: string): readonly string[] {
  const run = LEADING_RUN.exec(text);
  if (!run) return [];

  return [...run[0].matchAll(BRACKET_TOKEN)].map((token) => (token[1] ?? "").trim());
}

function withoutSymbols(token: string): string {
  return token.replace(SYMBOL, " ").replace(/\s+/g, " ").trim();
}

function isKeywordToken(token: string): boolean {
  const bare = withoutSymbols(token);
  const normalized = bare.toLowerCase();

  return (
    normalized.length > 0 &&
    !ARROW.test(bare) &&
    !DIGITS_ONLY.test(normalized) &&
    !LEVEL.test(normalized) &&
    !PLACEHOLDER.has(normalized)
  );
}

function keywordId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function keywordName(token: string): string {
  return token
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (/^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("");
}

function keywordCost(id: string, token: string, following: string): string | null {
  const symbols = token.match(SYMBOL) ?? (GAINED_KEYWORDS.has(id) ? null : following.match(SYMBOL));

  return symbols === null ? null : symbols.join(" ");
}

function parseKeyword(token: string, following: string): OwnedKeyword {
  const bare = withoutSymbols(token);
  const magnitude = MAGNITUDE.exec(bare);
  const name = keywordName(magnitude ? (magnitude[1] ?? bare) : bare);
  const id = keywordId(name);

  return {
    id,
    name,
    value: magnitude ? Number(magnitude[2]) : null,
    cost: keywordCost(id, token, following),
  };
}

type Span = readonly [number, number];

function reminderSpans(text: string): readonly Span[] {
  return [...text.matchAll(REMINDER)].map(
    (reminder) => [reminder.index, reminder.index + reminder[0].length] as const,
  );
}

function quotedSpans(text: string): readonly Span[] {
  const marks = [...text.matchAll(QUOTE)];
  const spans: Span[] = [];

  for (let index = 0; index + 1 < marks.length; index += 2) {
    const opening = marks.at(index);
    const closing = marks.at(index + 1);
    if (opening === undefined || closing === undefined) continue;
    spans.push([opening.index, closing.index + closing[0].length] as const);
  }

  return spans;
}

function spanAt(spans: readonly Span[], position: number): Span | null {
  return spans.find(([start, end]) => position > start && position < end) ?? null;
}

function costFollowing(text: string, position: number): string {
  return TRAILING_COST.exec(text.slice(position))?.[0] ?? "";
}

function leadIn(text: string, position: number): string {
  let head = text.slice(0, position);

  for (let stripped = head.replace(COORDINATED_TAIL, ""); stripped !== head;) {
    head = stripped;
    stripped = head.replace(COORDINATED_TAIL, "");
  }

  return head;
}

function phraseTargets(
  phrases: readonly TargetPhrase[],
  lead: string,
  trailing: string,
): readonly KeywordTarget[] | null {
  const matched = phrases.find((phrase) =>
    match(phrase)
      .with({ type: "leadIn" }, (rule) => rule.leadIn.test(lead))
      .with({ type: "trailing" }, (rule) => rule.trailing.test(trailing))
      .with(
        { type: "surrounding" },
        (rule) => rule.leadIn.test(lead) && rule.trailing.test(trailing),
      )
      .exhaustive(),
  );

  return matched?.targets ?? null;
}

function grantedTargeting(
  text: string,
  quoted: Span,
  lead: string,
  trailing: string,
): KeywordTargeting {
  const preceding = text.slice(0, quoted[0]);
  let bearer: { readonly at: number; readonly target: KeywordTarget } | null = null;

  for (const [phrase, target] of GRANTED_BEARERS) {
    for (const named of preceding.matchAll(phrase)) {
      if (bearer === null || named.index > bearer.at) bearer = { at: named.index, target };
    }
  }

  return bearer === null
    ? { type: "unclassified", leadIn: lead, trailing }
    : { type: "targeted", targets: [bearer.target] };
}

function targetingOf(text: string, position: number, end: number, id: string): KeywordTargeting {
  const lead = leadIn(text, position);
  const trailing = text.slice(end, end + TRAILING_WINDOW);
  const actor = phraseTargets(ACTOR_LEAD_INS, lead, trailing);
  if (actor) return { type: "targeted", targets: actor };
  if (CONTROLLER_KEYWORDS.has(id)) return { type: "targeted", targets: [OWN_PLAYER] };
  const targets = phraseTargets(CLASSIFIED_PHRASES, lead, trailing);
  if (targets) return { type: "targeted", targets };
  if (ABILITY_OPENER.test(lead)) return { type: "targeted", targets: [SELF] };

  return { type: "unclassified", leadIn: lead, trailing };
}

function targetKey(target: KeywordTarget): string {
  return `${target.kind}:${target.isToken}:${target.allegiance}`;
}

function occurrenceKey(occurrence: KeywordOccurrence): string {
  return match(occurrence.targeting)
    .with(
      { type: "targeted" },
      ({ targets }) => `${occurrence.id}\u0000${targets.map(targetKey).join("|")}`,
    )
    .with(
      { type: "unclassified" },
      ({ leadIn, trailing }) => `${occurrence.id}\u0000?${leadIn}\u0000${trailing}`,
    )
    .exhaustive();
}

function keywordOccurrences(text: string): readonly KeywordOccurrence[] {
  const reminders = reminderSpans(text);
  const granted = quotedSpans(text);
  const byKey = new Map<string, KeywordOccurrence>();

  for (const token of text.matchAll(BRACKET_TOKEN)) {
    const inner = (token[1] ?? "").trim();
    if (!isKeywordToken(inner)) continue;

    const quoted = spanAt(granted, token.index);
    if (quoted === null && spanAt(reminders, token.index) !== null) continue;

    const end = token.index + token[0].length;
    const keyword = parseKeyword(inner, costFollowing(text, end));
    const occurrence = {
      ...keyword,
      targeting:
        quoted === null
          ? targetingOf(text, token.index, end, keyword.id)
          : grantedTargeting(
              text,
              quoted,
              leadIn(text, token.index),
              text.slice(end, end + TRAILING_WINDOW),
            ),
    };
    const key = occurrenceKey(occurrence);
    const held = byKey.get(key);
    if (!held || (held.value ?? 0) < (occurrence.value ?? 0)) byKey.set(key, occurrence);
  }

  return [...byKey.values()];
}

function ownedKeywords(text: string): readonly OwnedKeyword[] {
  const run = LEADING_RUN.exec(text)?.[0] ?? "";
  const byId = new Map<string, OwnedKeyword>();

  for (const token of run.matchAll(BRACKET_TOKEN)) {
    const inner = (token[1] ?? "").trim();
    if (!isKeywordToken(inner)) continue;

    const keyword = parseKeyword(inner, costFollowing(text, token.index + token[0].length));
    const held = byId.get(keyword.id);
    if (!held || (held.value ?? 0) < (keyword.value ?? 0)) byId.set(keyword.id, keyword);
  }

  return [...byId.values()];
}

function keywordsWithMagnitude(texts: Iterable<string>): ReadonlySet<string> {
  const ids = new Set<string>();

  for (const text of texts) {
    for (const keyword of keywordOccurrences(text)) {
      if (keyword.value !== null) ids.add(keyword.id);
    }
  }

  return ids;
}

function withMagnitudeDefaults<Keyword extends OwnedKeyword>(
  keywords: readonly Keyword[],
  magnitudeIds: ReadonlySet<string>,
): readonly Keyword[] {
  return keywords.map((keyword) =>
    keyword.value === null && magnitudeIds.has(keyword.id) ? { ...keyword, value: 1 } : keyword,
  );
}

function declaredSpeeds(line: string): readonly CardSpeed[] {
  const held = new Set(ownedKeywords(line).map((keyword) => keyword.id));
  const speeds: CardSpeed[] = [];

  if (held.has("action") || held.has("hidden")) speeds.push("action");
  if (held.has("reaction") || held.has("hidden")) speeds.push("reaction");

  return speeds;
}

function cardSpeeds(text: string): readonly CardSpeed[] {
  const [firstLine = "", ...laterLines] = text.split(LINE_BREAK);
  const speeds = new Set<CardSpeed>(declaredSpeeds(firstLine));

  if (speeds.size === 0) speeds.add("normal");
  for (const line of laterLines) for (const speed of declaredSpeeds(line)) speeds.add(speed);

  return SPEED_ORDER.filter((speed) => speeds.has(speed));
}

const CHAMPION_SUPERTYPES = new Set(["Champion", "Signature"]);

interface ChampionCandidate {
  readonly name: string;
  readonly champion: string | null;
  readonly supertypeId: string | null;
  readonly typeId: string;
}

function normalizedPunctuation(text: string): string {
  return text
    .normalize("NFC")
    .replace(APOSTROPHE_VARIANT, "'")
    .replace(QUOTE_VARIANT, '"')
    .replace(DASH_VARIANT, "-")
    .replace(WHITESPACE_RUN, " ")
    .trim();
}

function championName({ name, champion, supertypeId, typeId }: ChampionCandidate): string | null {
  if (typeId !== "Legend" && !CHAMPION_SUPERTYPES.has(supertypeId ?? "")) return null;

  const named = normalizedPunctuation(champion ?? "");
  if (named.length > 0) return named;

  const printed = normalizedPunctuation(name);
  const [prefix = ""] = printed.split(NAME_SEPARATOR);
  const trimmed = prefix.trim();

  return trimmed.length > 0 && trimmed !== printed ? trimmed : null;
}

function identityName(name: string): string {
  return normalizedPunctuation(name)
    .replace(NAME_QUALIFIER, "")
    .trim()
    .split(NAME_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(CANONICAL_SEPARATOR);
}

function cleanName(name: string): string {
  return normalizedPunctuation(name)
    .replace(ELIDED_APOSTROPHE, "")
    .replace(SEPARATOR_RUN, " ")
    .trim();
}

function printingIdentity(riftboundId: string): PrintingIdentity {
  const [, ...segments] = riftboundId.split("-");
  const withoutFinish =
    segments.length > 1 && !DIGITS_ONLY.test(segments.at(-1) ?? "")
      ? segments.slice(0, -1)
      : segments;
  const hasPool = withoutFinish.length > 1 && DIGITS_ONLY.test(withoutFinish.at(-1) ?? "");
  const poolCode = hasPool ? (withoutFinish.at(-1) ?? null) : null;
  const numberSegments = hasPool ? withoutFinish.slice(0, -1) : withoutFinish;

  return {
    poolCode,
    collectorNumber: numberSegments.length > 0 ? numberSegments.join("-") : null,
  };
}

function printingFinish(printedName: string, flags: FeedFinishFlags): PrintingFinish {
  const label = TRAILING_PARENTHETICAL.exec(printedName)?.[1]?.trim();

  if (label !== undefined && label.length > 0 && !DIGITS_ONLY.test(label)) {
    const named = FINISH_BY_LABEL[label];
    if (named === undefined)
      throw new Error(`Unknown printing finish "${label}" in the printed name "${printedName}".`);

    return named;
  }

  if (flags.signature) return "signature";
  if (flags.overnumbered) return "overnumbered";
  if (flags.alternateArt) return "alternateArt";

  return "standard";
}

function printingId(release: PrintingRelease): string {
  return [
    release.setCode.toLowerCase(),
    release.collectorNumber,
    ...(release.poolCode === null ? [] : [release.poolCode]),
    ...FINISH_ID_SEGMENTS[release.finish],
  ].join("-");
}

export {
  ACTOR_LEAD_INS,
  CANONICAL_SEPARATOR,
  SELF_LEAD_INS,
  SELF_TRAILING_TARGETS,
  TARGET_LEAD_INS,
  TARGET_TRAILING_TARGETS,
  cardSpeeds,
  championName,
  cleanName,
  identityName,
  keywordOccurrences,
  keywordsWithMagnitude,
  leadIn,
  leadingTokens,
  normalizedPunctuation,
  ownedKeywords,
  printingFinish,
  printingId,
  printingIdentity,
  withMagnitudeDefaults,
};
export type {
  CardSpeed,
  ChampionCandidate,
  FeedFinishFlags,
  KeywordAllegiance,
  KeywordOccurrence,
  KeywordTarget,
  KeywordTargetKind,
  KeywordTargeting,
  OwnedKeyword,
  PrintingIdentity,
  PrintingRelease,
};
