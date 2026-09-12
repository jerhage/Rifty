import { render, screen } from "@testing-library/react-native";

import type { CardSummary } from "@/features/card/card-summary";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { CardGridItem } from "@/features/catalog/presentation/components/grid/card-grid-item";

const ZED: CardSummary = {
  printingId: printingIdSchema.parse("ogn-001"),
  riftboundId: "ogn-001-100",
  name: "Zed",
  domainIds: ["Fury", "Body"],
  orientation: "portrait",
  imageUrl: "http://localhost:8787/ogn-001-100.webp",
};

describe("CardGridItem", () => {
  it("should announce the domains the face shows rather than a bare open instruction", async () => {
    await render(<CardGridItem card={ZED} onPress={() => undefined} width={null} />);

    expect(screen.getByRole("button", { name: "Zed, Fury, Body" })).toBeTruthy();
  });

  it("should letter each domain on the face, so the two hues are not the only signal", async () => {
    await render(<CardGridItem card={ZED} onPress={() => undefined} width={null} />);

    expect(screen.getByText("F", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("B", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("F")).toBeNull();
  });

  it("should name a card with no domain colorless", async () => {
    await render(
      <CardGridItem card={{ ...ZED, domainIds: [] }} onPress={() => undefined} width={null} />,
    );

    expect(screen.getByRole("button", { name: "Zed, Colorless" })).toBeTruthy();
  });
});
