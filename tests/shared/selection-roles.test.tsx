import { render, screen } from "@testing-library/react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";

describe("Chip", () => {
  it("should announce an independent filter as a checkbox carrying its checked state", async () => {
    await render(<Chip label="Fury" onPress={() => undefined} selected />);

    const chip = screen.getByRole("checkbox", { name: "Fury" });
    expect(chip.props.accessibilityState).toEqual({ checked: true });
  });

  it("should report an unpicked filter as unchecked rather than unselected", async () => {
    await render(<Chip label="Body" onPress={() => undefined} selected={false} />);

    expect(screen.getByRole("checkbox", { name: "Body" }).props.accessibilityState).toEqual({
      checked: false,
    });
  });
});

describe("SegmentedOption", () => {
  it("should take the role of a tab when the option swaps the pane below it", async () => {
    await render(
      <SegmentedControl>
        <SegmentedOption label="Pool" onPress={() => undefined} role="tab" selected />
      </SegmentedControl>,
    );

    expect(screen.getByRole("tab", { name: "Pool" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it("should take the role of a radio when the option picks one value of a set", async () => {
    await render(
      <SegmentedControl>
        <SegmentedOption label="List" onPress={() => undefined} role="radio" selected={false} />
      </SegmentedControl>,
    );

    expect(screen.getByRole("radio", { name: "List" })).toBeTruthy();
  });

  it("should speak the given label in place of one whose punctuation reads badly", async () => {
    await render(
      <SegmentedControl>
        <SegmentedOption
          accessibilityLabel="In deck, 12"
          label="In deck · 12"
          onPress={() => undefined}
          role="tab"
          selected={false}
        />
      </SegmentedControl>,
    );

    expect(screen.getByRole("tab", { name: "In deck, 12" })).toBeTruthy();
    expect(screen.getByText("In deck · 12")).toBeTruthy();
  });
});
