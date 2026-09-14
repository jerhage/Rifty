import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import type { Card } from "@/features/card/card";
import type { CardFinder } from "@/features/card/card-finder";
import { CardDetailData } from "@/features/card/presentation/data/card-detail-data";

import { card, cardSet } from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const STORE_FAILURE = new Error("The store is unavailable.");
const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
const vi = card("vi", unleashed.code, { name: "Vi" });

async function renderCardDetail(cardFinder: CardFinder) {
  return await render(
    <CardDetailData cardFinder={cardFinder} printingId={vi.printingId}>
      {(found: Card) => <Text>{found.name}</Text>}
    </CardDetailData>,
    { wrapper: createTestWrapper() },
  );
}

describe("CardDetailData", () => {
  it("should render the card once the finder answers", async () => {
    await renderCardDetail({ get: () => Promise.resolve(vi) });

    expect(await screen.findByText("Vi")).toBeTruthy();
  });

  it("should not render the card before the finder answers", async () => {
    await renderCardDetail({ get: () => new Promise<Card | null>(() => {}) });

    expect(screen.queryByText("Vi")).toBeNull();
    expect(screen.queryByText("Card not found.")).toBeNull();
    expect(screen.queryByText("Could not load this card.")).toBeNull();
  });

  it("should report a missing card as an answer rather than a failure", async () => {
    await renderCardDetail({ get: () => Promise.resolve(null) });

    expect(await screen.findByText("Card not found.")).toBeTruthy();
  });

  it("should report a failure when the finder throws", async () => {
    await renderCardDetail({ get: () => Promise.reject(STORE_FAILURE) });

    expect(await screen.findByText("Could not load this card.")).toBeTruthy();
  });
});
