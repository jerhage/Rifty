type CardSpeed = "normal" | "action" | "reaction";

interface OwnedKeyword {
  readonly id: string;
  readonly name: string;
  readonly value: number | null;
  readonly cost: string | null;
}

interface PrintingIdentity {
  readonly poolCode: string | null;
  readonly collectorNumber: number | null;
  readonly isOvernumbered: boolean;
  readonly isSignature: boolean;
}

const LEADING_RUN = /^\s*(?:\[[^\]]+\]\s*(?:\([^)]*\)\s*)?)+/;
const BRACKET_TOKEN = /\[([^\]]+)\]/g;
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

function leadingTokens(text: string): readonly string[] {
  const run = LEADING_RUN.exec(text);
  if (!run) return [];

  return [...run[0].matchAll(BRACKET_TOKEN)].map((match) => (match[1] ?? "").trim());
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

function keywordCost(token: string): string | null {
  const symbols = token.match(SYMBOL);

  return symbols === null ? null : symbols.join(" ");
}

function parseKeyword(token: string): OwnedKeyword {
  const bare = withoutSymbols(token);
  const magnitude = MAGNITUDE.exec(bare);
  const name = keywordName(magnitude ? (magnitude[1] ?? bare) : bare);

  return {
    id: keywordId(name),
    name,
    value: magnitude ? Number(magnitude[2]) : null,
    cost: keywordCost(token),
  };
}

function ownedKeywords(text: string): readonly OwnedKeyword[] {
  const byId = new Map<string, OwnedKeyword>();

  for (const token of leadingTokens(text)) {
    if (!isKeywordToken(token)) continue;

    const keyword = parseKeyword(token);
    const held = byId.get(keyword.id);
    if (!held || (held.value ?? 0) < (keyword.value ?? 0)) byId.set(keyword.id, keyword);
  }

  return [...byId.values()];
}

function keywordsWithMagnitude(texts: Iterable<string>): ReadonlySet<string> {
  const ids = new Set<string>();

  for (const text of texts) {
    for (const keyword of ownedKeywords(text)) {
      if (keyword.value !== null) ids.add(keyword.id);
    }
  }

  return ids;
}

function withMagnitudeDefaults(
  keywords: readonly OwnedKeyword[],
  magnitudeIds: ReadonlySet<string>,
): readonly OwnedKeyword[] {
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
  cardSpeeds,
  championName,
  identityName,
  keywordsWithMagnitude,
  leadingTokens,
  ownedKeywords,
  printingIdentity,
  withMagnitudeDefaults,
};
export type { CardSpeed, ChampionCandidate, OwnedKeyword, PrintingIdentity };
