import { fireEvent, render, screen } from "@testing-library/react-native";

import { IconButton } from "@/components/ui/atoms/icon-button";

describe("IconButton", () => {
  it("should name the action rather than the glyph it draws", async () => {
    await render(<IconButton accessibilityLabel="Back" glyph="←" onPress={() => undefined} />);

    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  it("should act on a plain press", async () => {
    let presses = 0;
    await render(<IconButton accessibilityLabel="Back" glyph="←" onPress={() => (presses += 1)} />);

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(presses).toBe(1);
  });
});
