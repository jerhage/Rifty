import { extname } from "node:path";

interface SourcedCard {
  readonly id: string;
  readonly riftboundId?: string | undefined;
  readonly imageUrl?: string | undefined;
  readonly imageSourceUrl?: string | undefined;
  readonly thumbnailUrl?: string | undefined;
  readonly raw?:
    | {
        readonly riftbound_id?: string | undefined;
        readonly media?: { readonly image_url?: string | null };
      }
    | undefined;
}

function sourceRank(url: string): number {
  const path = url.split("?").at(0) ?? url;

  if (/\.thumb\.\w+$/.test(path)) return 2;

  return path.endsWith(".webp") ? 0 : 1;
}

function imageSourcesOf(card: SourcedCard): readonly string[] {
  const known = [
    card.imageUrl,
    card.raw?.media?.image_url ?? undefined,
    card.imageSourceUrl,
    card.thumbnailUrl,
  ].filter((url): url is string => typeof url === "string" && url.length > 0);

  return [...new Set(known)]
    .map((url, index) => ({ url, index, rank: sourceRank(url) }))
    .sort((one, other) => one.rank - other.rank || one.index - other.index)
    .map((entry) => entry.url);
}

function riftboundIdOf(card: SourcedCard): string {
  return card.riftboundId ?? card.raw?.riftbound_id ?? card.id;
}

function baseNameOf(riftboundId: string): string {
  return riftboundId
    .replace(/\*/g, "s")
    .replace(/[^\w.-]+/g, "-")
    .toLowerCase();
}

const IMAGE_EXTENSION = ".webp";

function extensionOf(url: string): string {
  const extension = extname(new URL(url).pathname).toLowerCase();

  return /^\.(png|webp|jpg|jpeg)$/.test(extension) ? extension : ".png";
}

function imageFileNames(cards: readonly SourcedCard[]): ReadonlyMap<string, string> {
  const taken = new Set<string>();
  const named = new Map<string, string>();

  for (const card of [...cards].sort((one, other) => one.id.localeCompare(other.id))) {
    const [source] = imageSourcesOf(card);
    if (source === undefined) continue;

    const base = baseNameOf(riftboundIdOf(card));
    let fileName = `${base}${IMAGE_EXTENSION}`;
    let suffix = 1;
    while (taken.has(fileName)) {
      suffix += 1;
      fileName = `${base}-${suffix}${IMAGE_EXTENSION}`;
    }
    taken.add(fileName);
    named.set(card.id, fileName);
  }

  return named;
}

function downloadTargetFor(fileName: string, sourceUrl: string): string {
  const extension = extensionOf(sourceUrl);

  return extension === IMAGE_EXTENSION
    ? fileName
    : fileName.replace(new RegExp(`\\${IMAGE_EXTENSION}$`), extension);
}

export { downloadTargetFor, imageFileNames, imageSourcesOf };
export type { SourcedCard };
