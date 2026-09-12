import { fireEvent, render, screen, within } from "@testing-library/react-native";

import type { Card } from "@/features/card/card";
import { limitedCopies } from "@/features/deck/deck/deck-legality";
import { BuildCardRow } from "@/features/deck/presentation/components/build/build-card-row";
import { BuildCardTile } from "@/features/deck/presentation/components/build/build-card-tile";
import { ChampionPickRow } from "@/features/deck/presentation/components/build/champion-pick-row";
import { LegendPickTile } from "@/features/deck/presentation/components/build/legend-pick-tile";
import { SHOW_FULL_CARD } from "@/features/deck/presentation/components/build/show-full-card-action";

import { card } from "../card/fixtures";

const ZED: Card = card("ogn-001", "OGN", { name: "Zed" });

async function showFullCard(name: string) {
  await fireEvent(screen.getByRole("radio", { name }), "accessibilityAction", {
    nativeEvent: { actionName: SHOW_FULL_CARD },
  });
}

describe("BuildCardTile", () => {
  it("should open the card when the tile is activated", async () => {
    const opened: Card[] = [];
    await render(
      <BuildCardTile
        allowance={limitedCopies(3)}
        card={ZED}
        minQuantity={0}
        onChange={() => undefined}
        onOpenCard={(opening) => opened.push(opening)}
        quantity={1}
        width={null}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Zed" }));

    expect(opened).toEqual([ZED]);
  });

  it("should keep the stepper outside the tile so it can be reached on its own", async () => {
    const changes: number[] = [];
    await render(
      <BuildCardTile
        allowance={limitedCopies(3)}
        card={ZED}
        minQuantity={0}
        onChange={(quantity) => changes.push(quantity)}
        quantity={1}
        onOpenCard={() => undefined}
        width={null}
      />,
    );

    const tile = screen.getByRole("button", { name: "Zed" });
    expect(within(tile).queryByRole("adjustable")).toBeNull();

    await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(changes).toEqual([2]);
  });
});

describe("BuildCardRow", () => {
  it("should open the card when the row is activated", async () => {
    const opened: Card[] = [];
    await render(
      <BuildCardRow
        allowance={limitedCopies(3)}
        card={ZED}
        minQuantity={0}
        onChange={() => undefined}
        onOpenCard={(opening) => opened.push(opening)}
        quantity={1}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Zed" }));

    expect(opened).toEqual([ZED]);
  });
});

describe("ChampionPickRow", () => {
  it("should pick the champion when the row is activated", async () => {
    const picked: Card[] = [];
    await render(
      <ChampionPickRow
        card={ZED}
        onOpenCard={() => undefined}
        onPick={(picking) => picked.push(picking)}
        selected={false}
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "Choose Zed" }));

    expect(picked).toEqual([ZED]);
  });

  it("should open the card through the accessibility action", async () => {
    const opened: Card[] = [];
    await render(
      <ChampionPickRow
        card={ZED}
        onOpenCard={(opening) => opened.push(opening)}
        onPick={() => undefined}
        selected={false}
      />,
    );

    await showFullCard("Choose Zed");

    expect(opened).toEqual([ZED]);
  });
});

describe("LegendPickTile", () => {
  it("should pick the legend when the tile is activated", async () => {
    const picked: Card[] = [];
    await render(
      <LegendPickTile
        card={ZED}
        onOpenCard={() => undefined}
        onPick={(picking) => picked.push(picking)}
        selected={false}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Choose Zed" }));

    expect(picked).toEqual([ZED]);
  });

  it("should open the card through the accessibility action", async () => {
    const opened: Card[] = [];
    await render(
      <LegendPickTile
        card={ZED}
        onOpenCard={(opening) => opened.push(opening)}
        onPick={() => undefined}
        selected={false}
      />,
    );

    await fireEvent(screen.getByRole("button", { name: "Choose Zed" }), "accessibilityAction", {
      nativeEvent: { actionName: SHOW_FULL_CARD },
    });

    expect(opened).toEqual([ZED]);
  });
});
