import { fireEvent, render, screen } from "@testing-library/react-native";

import type { Card } from "@/features/card/card";
import { HandCardTile } from "@/features/deck/presentation/components/draw/hand-card-tile";
import { SHOW_FULL_CARD } from "@/features/deck/presentation/show-full-card-action";

import { card } from "../card/fixtures";

const ZED: Card = card("ogn-001", "OGN", { name: "Zed" });
const ZED_IN_HAND = "Zed, 3 energy";

describe("HandCardTile", () => {
  it("should open the card through the accessibility action, since the tap mulligans", async () => {
    const opened: Card[] = [];
    await render(
      <HandCardTile
        card={ZED}
        onOpenCard={(opening) => opened.push(opening)}
        onToggleSelection={() => undefined}
        selected={false}
      />,
    );

    await fireEvent(screen.getByRole("checkbox", { name: ZED_IN_HAND }), "accessibilityAction", {
      nativeEvent: { actionName: SHOW_FULL_CARD },
    });

    expect(opened).toEqual([ZED]);
  });

  it("should leave the plain press on the mulligan selection", async () => {
    let toggles = 0;
    await render(
      <HandCardTile
        card={ZED}
        onOpenCard={() => undefined}
        onToggleSelection={() => (toggles += 1)}
        selected={false}
      />,
    );

    await fireEvent.press(screen.getByRole("checkbox", { name: ZED_IN_HAND }));

    expect(toggles).toBe(1);
  });
});
