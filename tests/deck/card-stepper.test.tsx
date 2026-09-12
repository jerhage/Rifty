import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";

import { limitedCopies, UNLIMITED_COPIES } from "@/features/deck/deck/deck-legality";
import { CardStepper } from "@/features/deck/presentation/components/build/card-stepper";

import { recordAnnouncements, type Announcement } from "../announcements";

function HeldStepper({ initial }: { readonly initial: number }) {
  const [quantity, setQuantity] = useState(initial);

  return (
    <CardStepper
      allowance={limitedCopies(3)}
      minQuantity={0}
      onChange={setQuantity}
      quantity={quantity}
    />
  );
}

async function adjust(actionName: string) {
  await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
    nativeEvent: { actionName },
  });
}

describe("CardStepper", () => {
  it("should report the quantity and the allowance as one adjustable value", async () => {
    await render(
      <CardStepper
        allowance={limitedCopies(3)}
        minQuantity={0}
        onChange={() => undefined}
        quantity={2}
      />,
    );

    expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({
      min: 0,
      max: 3,
      now: 2,
    });
  });

  it("should report no maximum when the copies are unlimited", async () => {
    await render(
      <CardStepper
        allowance={UNLIMITED_COPIES}
        minQuantity={0}
        onChange={() => undefined}
        quantity={7}
      />,
    );

    expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({ min: 0, now: 7 });
  });

  it("should add and remove a copy through the increment and decrement actions", async () => {
    const changes: number[] = [];
    await render(
      <CardStepper
        allowance={limitedCopies(3)}
        minQuantity={0}
        onChange={(quantity) => changes.push(quantity)}
        quantity={1}
      />,
    );

    await adjust("increment");
    await adjust("decrement");

    expect(changes).toEqual([2, 0]);
  });

  it("should refuse an increment at the allowance and a decrement at the minimum", async () => {
    const changes: number[] = [];
    await render(
      <CardStepper
        allowance={limitedCopies(2)}
        minQuantity={2}
        onChange={(quantity) => changes.push(quantity)}
        quantity={2}
      />,
    );

    await adjust("increment");
    await adjust("decrement");

    expect(changes).toEqual([]);
  });

  it("should carry the new quantity on its accessibility value after an increment", async () => {
    await render(<HeldStepper initial={1} />);

    await adjust("increment");

    expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({
      min: 0,
      max: 3,
      now: 2,
    });
  });

  it("should hide the step buttons so the adjustable actions are the only assistive path", async () => {
    await render(<HeldStepper initial={1} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("+")).toBeNull();
    expect(screen.queryByText("−")).toBeNull();
    expect(screen.queryByText("+", { includeHiddenElements: true })).not.toBeNull();
  });

  it("should add no announcement of its own, leaving the adjustable value to speak", async () => {
    const announcements: Announcement[] = recordAnnouncements();
    await render(<HeldStepper initial={1} />);

    await adjust("increment");
    await adjust("decrement");

    expect(announcements).toEqual([]);
    jest.restoreAllMocks();
  });
});
