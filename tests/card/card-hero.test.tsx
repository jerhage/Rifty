import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { CardHero } from "@/features/card/presentation/components/detail/card-hero";

import { card } from "./fixtures";

function artStyle(name: string) {
  return StyleSheet.flatten(screen.getByLabelText(`${name} card art`).props.style);
}

describe("CardHero", () => {
  it("should shape the art rather than the frame around it", async () => {
    await render(<CardHero card={card("p1", "OGN", { name: "Portrait" })} />);

    expect(artStyle("Portrait").aspectRatio).toBeCloseTo(5 / 7);
  });

  it("should turn the shape for a landscape printing", async () => {
    await render(
      <CardHero card={card("p2", "OGN", { name: "Landscape", orientation: "landscape" })} />,
    );

    expect(artStyle("Landscape").aspectRatio).toBeCloseTo(7 / 5);
  });

  /**
   * The frame caps its own width, so an aspect ratio on the frame resolves against the cap rather
   * than the width it was given, and in a narrower pane it stands taller than the art inside it.
   */
  it("should give the art no height of its own, so the frame cannot outgrow it", async () => {
    await render(<CardHero card={card("p3", "OGN", { name: "Capped" })} />);

    expect(artStyle("Capped").height).toBeUndefined();
    expect(artStyle("Capped").width).toBe("100%");
  });
});
