const IMAGE_BASE_URL = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live";

interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

interface ImageReference {
  readonly assetId: string;
  readonly dimensions: ImageDimensions;
}

function buildImageUrl(assetId: string, { width, height }: ImageDimensions): string {
  return `${IMAGE_BASE_URL}/${assetId}-${width}x${height}.png`;
}

function parseImageUrl(value: string): ImageReference {
  const match = new RegExp(
    `^${escapeRegularExpression(IMAGE_BASE_URL)}/([a-f0-9]{40})-(\\d+)x(\\d+)\\.png(?:\\?.*)?$`,
  ).exec(value);
  if (!match) throw new Error(`Unsupported image URL: ${value}`);

  return {
    assetId: match[1],
    dimensions: { width: Number(match[2]), height: Number(match[3]) },
  };
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { buildImageUrl, parseImageUrl };
export type { ImageDimensions, ImageReference };
