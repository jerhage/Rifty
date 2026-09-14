import { render, screen } from "@testing-library/react-native";

import type { Card } from "@/features/card/card";
import { COUNTED_SECTION_RULES } from "@/features/deck/deck/deck-legality";
import { SectionSelector } from "@/features/deck/presentation/components/build/section-selector";
import { DeckRow } from "@/features/deck/presentation/components/deck-row";
import { DeckCardRow } from "@/features/deck/presentation/components/detail/deck-card-row";
import { HandCardTile } from "@/features/deck/presentation/components/draw/hand-card-tile";

import { card } from "../card/fixtures";
import { deck } from "./fixtures";

const ZED: Card = card("ogn-001", "OGN", {
  name: "Zed",
  attributes: { energy: 3, might: 5, power: null },
});

describe("DeckCardRow", () => {
  it("should announce the card, the copies held and the subline the row shows", async () => {
    await render(<DeckCardRow card={ZED} onOpenCard={() => undefined} quantity={2} />);

    expect(
      screen.getByRole("button", { name: "Zed, 2 copies, Unit, 3 energy, 5 might" }),
    ).toBeTruthy();
  });

  it("should count a single copy in the singular", async () => {
    await render(<DeckCardRow card={ZED} onOpenCard={() => undefined} quantity={1} />);

    expect(
      screen.getByRole("button", { name: "Zed, 1 copy, Unit, 3 energy, 5 might" }),
    ).toBeTruthy();
  });
});

describe("DeckRow", () => {
  it("should announce the deck size and when it was edited instead of only its name", async () => {
    const midrange = deck("deck-1", {
      name: "Midrange Fury",
      updatedAt: "2026-09-01T07:00:00.000Z",
      entries: [
        { section: "mainDeck", cardId: "Card 001", printingId: "ogn-001", quantity: 4 },
        { section: "sideboard", cardId: "Card 001", printingId: "ogn-001", quantity: 2 },
      ],
    });

    await render(
      <DeckRow deck={midrange} now="2026-09-01T10:00:00.000Z" onOpen={() => undefined} />,
    );

    expect(
      screen.getByRole("button", { name: "Midrange Fury, 4 cards, 2 side, edited 3 hours ago" }),
    ).toBeTruthy();
  });
});

describe("HandCardTile", () => {
  it("should announce the cost badge and report the toggle as checked", async () => {
    await render(
      <HandCardTile
        card={ZED}
        onOpenCard={() => undefined}
        onToggleSelection={() => undefined}
        selected
      />,
    );

    const tile = screen.getByRole("checkbox", { name: "Zed, 3 energy" });
    expect(tile.props.accessibilityState).toEqual({ checked: true });
  });
});

describe("SectionSelector", () => {
  it("should announce each section as a tab rather than a plain button", async () => {
    const [firstSection] = COUNTED_SECTION_RULES;
    if (firstSection === undefined) throw new Error("No section rules to select between.");

    await render(
      <SectionSelector counts={{}} onSelect={() => undefined} selected={firstSection.section} />,
    );

    expect(screen.getAllByRole("tab")).toHaveLength(COUNTED_SECTION_RULES.length);
  });
});
