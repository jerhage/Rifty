import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { imageFileNames, imageSourcesOf, type SourcedCard } from "./card-image-file";

const inputDirectory = process.env.CARD_FETCH_OUTPUT_DIRECTORY ?? "data/api";
const imageDirectory = process.env.CARD_IMAGE_DIRECTORY ?? "data/images";
const minDelayMs = Number(process.env.CARD_IMAGE_MIN_DELAY_MS ?? 200);
const maxDelayMs = Number(process.env.CARD_IMAGE_MAX_DELAY_MS ?? 600);
const concurrency = Number(process.env.CARD_IMAGE_CONCURRENCY ?? 4);
const maxAttempts = Number(process.env.CARD_IMAGE_MAX_ATTEMPTS ?? 3);
const userAgent =
  process.env.RIFTBOUND_USER_AGENT ??
  "riftcards-catalog-import (personal deck builder; low volume)";

interface PendingImage {
  readonly cardId: string;
  readonly fileName: string;
  readonly sources: readonly string[];
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function delayMs(): number {
  return minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs);
}

async function readCards(): Promise<readonly SourcedCard[]> {
  const files = (await readdir(inputDirectory)).filter((name) => name.endsWith(".json")).sort();
  const cards = new Map<string, SourcedCard>();

  for (const file of files) {
    const parsed = JSON.parse(await readFile(join(inputDirectory, file), "utf8")) as {
      cards: SourcedCard[];
    };
    for (const card of parsed.cards) cards.set(card.id, card);
  }

  return [...cards.values()];
}

function planDownloads(cards: readonly SourcedCard[]): readonly PendingImage[] {
  const named = imageFileNames(cards);

  return cards.flatMap((card) => {
    const fileName = named.get(card.id);
    if (fileName === undefined) return [];

    return [{ cardId: card.id, fileName, sources: imageSourcesOf(card) }];
  });
}

async function alreadyOnDisk(fileName: string): Promise<boolean> {
  try {
    return (await stat(join(imageDirectory, fileName))).size > 0;
  } catch {
    return false;
  }
}

async function download(image: PendingImage): Promise<void> {
  let lastError: unknown = new Error("no source");

  for (const source of image.sources) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(source, { headers: { "user-agent": userAgent } });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

        await writeFile(
          join(imageDirectory, image.fileName),
          new Uint8Array(await response.arrayBuffer()),
        );

        return;
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) await wait(1500 * 2 ** (attempt - 1) + Math.random() * 500);
      }
    }
  }

  throw lastError;
}

await mkdir(imageDirectory, { recursive: true });

const planned = planDownloads(await readCards());
const manifest: Record<string, string> = {};
for (const image of planned) manifest[image.cardId] = image.fileName;

const queue = [...planned];
let downloaded = 0;
let skipped = 0;
const failures: string[] = [];

async function worker(): Promise<void> {
  for (let image = queue.shift(); image !== undefined; image = queue.shift()) {
    if (await alreadyOnDisk(image.fileName)) {
      skipped += 1;
      continue;
    }

    try {
      await download(image);
      downloaded += 1;
      if (downloaded % 50 === 0) console.log(`  downloaded ${downloaded}`);
    } catch (error) {
      failures.push(`${image.fileName}: ${String(error)}`);
    }

    await wait(delayMs());
  }
}

console.log(`${planned.length} images planned into ${imageDirectory}`);
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));

await writeFile(
  join(imageDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`downloaded ${downloaded}, already present ${skipped}, failed ${failures.length}`);
for (const failure of failures.slice(0, 10)) console.warn(`  ${failure}`);
