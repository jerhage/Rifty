import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod/v4";

const apiBase = process.env.RIFTBOUND_API_BASE ?? "https://www.riftbound-db.com/api/cards";
const outputDirectory = process.env.CARD_FETCH_OUTPUT_DIRECTORY ?? "data/api";
const setCodes = (process.env.RIFTBOUND_SETS ?? "OGN,OGS,UNL,VEN,SFD,PR,OPP,JDG,RAD")
  .split(",")
  .map((code) => code.trim().toUpperCase())
  .filter((code) => code.length > 0);
const pageSize = Number(process.env.RIFTBOUND_PAGE_SIZE ?? 80);
const minDelayMs = Number(process.env.RIFTBOUND_MIN_DELAY_MS ?? 900);
const maxDelayMs = Number(process.env.RIFTBOUND_MAX_DELAY_MS ?? 2400);
const maxAttempts = Number(process.env.RIFTBOUND_MAX_ATTEMPTS ?? 4);
const pageLimit = Number(process.env.RIFTBOUND_PAGE_LIMIT ?? 60);
const userAgent =
  process.env.RIFTBOUND_USER_AGENT ??
  "riftcards-catalog-import (personal deck builder; low volume)";

const paginationSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
});
const cardSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  setCode: z.string(),
});
const responseSchema = z.object({
  cards: z.array(cardSchema),
  pagination: paginationSchema,
});

type FetchedCard = z.output<typeof cardSchema>;

function delayMs(): number {
  return minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function pageUrl(setCode: string, page: number): string {
  const url = new URL(apiBase);
  url.searchParams.set("set", setCode);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  return url.toString();
}

async function fetchPage(url: string): Promise<z.output<typeof responseSchema>> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", "user-agent": userAgent },
      });

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} (not retried)`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`expected JSON, received ${contentType || "no content type"}`);
      }

      return responseSchema.parse(await response.json());
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;

      const backoff = 2000 * 2 ** (attempt - 1) + Math.random() * 1000;
      console.warn(
        `  attempt ${attempt} failed (${String(error)}), retrying in ${Math.round(backoff)}ms`,
      );
      await wait(backoff);
    }
  }

  throw new Error(`Could not fetch ${url}: ${String(lastError)}`);
}

async function fetchSet(setCode: string): Promise<readonly FetchedCard[]> {
  const collected = new Map<string, FetchedCard>();
  let page = 1;
  let expected = 0;

  while (page <= pageLimit) {
    const { cards, pagination } = await fetchPage(pageUrl(setCode, page));
    expected = pagination.total;

    for (const card of cards) collected.set(card.id, card);
    console.log(`  ${setCode} page ${page}: ${cards.length} cards (${collected.size}/${expected})`);

    if (!pagination.hasMore || cards.length === 0) break;

    page += 1;
    await wait(delayMs());
  }

  if (collected.size !== expected) {
    console.warn(`  ${setCode}: collected ${collected.size} but the API reported ${expected}`);
  }

  return [...collected.values()];
}

async function fetchCatalogTotal(): Promise<number> {
  const url = new URL(apiBase);
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", "1");

  return (await fetchPage(url.toString())).pagination.total;
}

await mkdir(outputDirectory, { recursive: true });

const fetchedAt = new Date().toISOString();
const everySeen = new Map<string, FetchedCard>();
const unexpectedSetCodes = new Set<string>();

for (const [index, setCode] of setCodes.entries()) {
  console.log(`${setCode} (${index + 1}/${setCodes.length})`);
  const cards = await fetchSet(setCode);

  for (const card of cards) {
    everySeen.set(card.id, card);
    if (!setCodes.includes(card.setCode.toUpperCase())) unexpectedSetCodes.add(card.setCode);
  }

  await writeFile(
    join(outputDirectory, `cards-${setCode}.json`),
    `${JSON.stringify({ setCode, fetchedAt, count: cards.length, cards }, null, 2)}\n`,
    "utf8",
  );

  if (index < setCodes.length - 1) await wait(delayMs());
}

await wait(delayMs());
const catalogTotal = await fetchCatalogTotal();

console.log(`\nSets fetched: ${setCodes.join(", ")}`);
console.log(`Distinct cards written: ${everySeen.size}`);
console.log(`Unfiltered catalog total: ${catalogTotal}`);

if (everySeen.size !== catalogTotal) {
  console.warn(
    `Missed ${catalogTotal - everySeen.size} cards. Some belong to sets not in RIFTBOUND_SETS.`,
  );
}
if (unexpectedSetCodes.size > 0) {
  console.warn(`Set codes seen but not requested: ${[...unexpectedSetCodes].sort().join(", ")}`);
}
