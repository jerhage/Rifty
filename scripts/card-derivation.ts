import { match } from "ts-pattern";

type CardSpeed = "normal" | "action" | "reaction";
type KeywordScope = "self" | "other";

type KeywordTargeting =
  | { readonly type: "targeted"; readonly scope: KeywordScope }
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
  readonly collectorNumber: number | null;
  readonly isOvernumbered: boolean;
  readonly isSignature: boolean;
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
const NAME_QUALIFIER = /\s*\([^)]*\)\s*$/;
const CANONICAL_SEPARATOR = " - ";
const LINE_BREAK = /\r?\n/;
const TRAILING_WINDOW = 40;

const ABILITY_OPENER = /(?:^|[\n.;:—–]|&quot;|")$/;
const CONTROLLER_KEYWORDS = new Set(["add", "burn", "predict"]);
const GAINED_KEYWORDS = new Set(["add"]);

const OTHER_ACTOR_LEAD_INS: readonly RegExp[] = [
  /\bthey$/i,
  /\bthey (?:may|can|must)$/i,
  /\beach player$/i,
];

const SELF_LEAD_INS: readonly RegExp[] = [
  /\bI have$/i,
  /\bI gain$/i,
  /\bI get$/i,
  /\bI keep$/i,
  /\bI['’]m$/i,
  /\bI am$/i,
  /\bI was$/i,
  /\bI become$/i,
  /\bI can be$/i,
  /\bgives? me$/i,
  /\bto me$/i,
  /\bmy$/i,
];

const OTHER_LEAD_INS: readonly RegExp[] = [
  /\bother friendly units here have$/i,
  /\bgives? (?:it|them|him|her|those|these)$/i,
  /\bgives? (?:a|an|the|your|their|each|one|another|every|all|any)\b[\w' +]*$/i,
  /\beach gives?$/i,
  /\b(?:have|has|gains?|gets?)$/i,
  /\bwith$/i,
  /\bbecomes?$/i,
  /\bfrom$/i,
  /\bignores?$/i,
  /\bwithout$/i,
  /\bone or more$/i,
  /\bthat(?: are| is|['’]s)$/i,
  /\bif (?:it|this|that|they|he|she)(?:['’]s|['’]re| is| are| was| were)?$/i,
  /\byour(?: [\w'’-]+)?$/i,
  /\b(?:a|an|the|their|its|other|another|each|every|all|any|friendly|enemy|opposing)$/i,
  /\b(?:units?|cards?|spells?|gears?|tokens?|opponents?|opponents['’]|players?)$/i,
];

const SELF_TRAILING_TARGETS: readonly RegExp[] = [
  /^[ \t]+(?:me|my|myself)\b/i,
];

const OTHER_TRAILING_TARGETS: readonly RegExp[] = [
  /^[ \t]+(?:it|them|him|her|those|these|they)\b/i,
  /^[ \t]+(?:an?|the|all|each|every|any|another)\b/i,
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

function reminderSpans(text: string): readonly (readonly [number, number])[] {
  return [...text.matchAll(REMINDER)].map(
    (reminder) => [reminder.index, reminder.index + reminder[0].length] as const,
  );
}

function isDefining(spans: readonly (readonly [number, number])[], position: number): boolean {
  return spans.some(([start, end]) => position > start && position < end);
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

function targetingOf(text: string, position: number, end: number, id: string): KeywordTargeting {
  const lead = leadIn(text, position);
  const trailing = text.slice(end, end + TRAILING_WINDOW);
  if (OTHER_ACTOR_LEAD_INS.some((phrase) => phrase.test(lead)))
    return { type: "targeted", scope: "other" };
  if (CONTROLLER_KEYWORDS.has(id)) return { type: "targeted", scope: "self" };
  if (SELF_LEAD_INS.some((phrase) => phrase.test(lead))) return { type: "targeted", scope: "self" };
  if (OTHER_LEAD_INS.some((phrase) => phrase.test(lead)))
    return { type: "targeted", scope: "other" };
  if (SELF_TRAILING_TARGETS.some((phrase) => phrase.test(trailing)))
    return { type: "targeted", scope: "self" };
  if (OTHER_TRAILING_TARGETS.some((phrase) => phrase.test(trailing)))
    return { type: "targeted", scope: "other" };
  if (ABILITY_OPENER.test(lead)) return { type: "targeted", scope: "self" };

  return { type: "unclassified", leadIn: lead, trailing };
}

function occurrenceKey(occurrence: KeywordOccurrence): string {
  return match(occurrence.targeting)
    .with({ type: "targeted" }, ({ scope }) => `${occurrence.id}\u0000${scope}`)
    .with(
      { type: "unclassified" },
      ({ leadIn, trailing }) => `${occurrence.id}\u0000?${leadIn}\u0000${trailing}`,
    )
    .exhaustive();
}

function keywordOccurrences(text: string): readonly KeywordOccurrence[] {
  const spans = reminderSpans(text);
  const byKey = new Map<string, KeywordOccurrence>();

  for (const token of text.matchAll(BRACKET_TOKEN)) {
    const inner = (token[1] ?? "").trim();
    if (!isKeywordToken(inner) || isDefining(spans, token.index)) continue;

    const end = token.index + token[0].length;
    const keyword = parseKeyword(inner, costFollowing(text, end));
    const occurrence = {
      ...keyword,
      targeting: targetingOf(text, token.index, end, keyword.id),
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

function championName({ name, champion, supertypeId, typeId }: ChampionCandidate): string | null {
  if (typeId !== "Legend" && !CHAMPION_SUPERTYPES.has(supertypeId ?? "")) return null;
  if (champion !== null && champion.trim().length > 0) return champion.trim();

  const [prefix] = name.split(NAME_SEPARATOR);
  if (prefix === undefined) return null;

  const trimmed = prefix.trim();

  return trimmed.length > 0 && trimmed !== name.trim() ? trimmed : null;
}

function identityName(name: string): string {
  return name
    .replace(NAME_QUALIFIER, "")
    .trim()
    .split(NAME_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(CANONICAL_SEPARATOR);
}

function printingIdentity(riftboundId: string): PrintingIdentity {
  const segments = riftboundId.split("-");
  const poolCode = segments.length >= 3 ? (segments.at(-1) ?? null) : null;
  const numberSegment = (poolCode === null ? segments.at(-1) : segments.at(-2)) ?? "";
  const isSignature = numberSegment.includes("*");
  const digits = /(\d+)/.exec(numberSegment);
  const collectorNumber = digits ? Number(digits[1]) : null;
  const poolSize = poolCode !== null && /^\d+$/.test(poolCode) ? Number(poolCode) : null;

  return {
    poolCode,
    collectorNumber,
    isOvernumbered:
      collectorNumber !== null && poolSize !== null ? collectorNumber > poolSize : false,
    isSignature,
  };
}

export {
  OTHER_ACTOR_LEAD_INS,
  OTHER_LEAD_INS,
  OTHER_TRAILING_TARGETS,
  SELF_LEAD_INS,
  SELF_TRAILING_TARGETS,
  cardSpeeds,
  championName,
  identityName,
  keywordOccurrences,
  keywordsWithMagnitude,
  leadIn,
  leadingTokens,
  ownedKeywords,
  printingIdentity,
  withMagnitudeDefaults,
};
export type {
  CardSpeed,
  ChampionCandidate,
  KeywordOccurrence,
  KeywordScope,
  KeywordTargeting,
  OwnedKeyword,
  PrintingIdentity,
};
