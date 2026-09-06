import { buildImageUrl, parseImageUrl } from "@/shared/image-url";

describe("image URLs", () => {
  it("builds a source URL from an asset id and its dimensions", () => {
    expect(
      buildImageUrl("15ed971e4029a92b362a81ccadf309fb81e40b81", {
        width: 744,
        height: 1039,
      }),
    ).toBe(
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/15ed971e4029a92b362a81ccadf309fb81e40b81-744x1039.png",
    );
  });

  it("extracts an asset id and dimensions from a source URL", () => {
    expect(
      parseImageUrl(
        "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/635a3a0b724a2cfc11938ecbc1d8abddd89d3436-1039x744.png?accountingTag=RB",
      ),
    ).toEqual({
      assetId: "635a3a0b724a2cfc11938ecbc1d8abddd89d3436",
      dimensions: { width: 1039, height: 744 },
    });
  });
});
