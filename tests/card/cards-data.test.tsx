import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { CardLister } from "@/features/card/card-lister";
import { CardsData } from "@/features/card/presentation/data/cards-data";
import { Page } from "@/shared/page";

import { card, cardSet } from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const PAGE_SIZE = 30;
const STORE_FAILURE = new Error("The store is unavailable.");
const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
const catalog: readonly Card[] = Array.from({ length: 31 }, (_, index) =>
  card(`card-${index + 1}`, unleashed.code, {
    collectorNumber: String(index + 1),
    name: `Card ${index + 1}`,
  }),
);

interface CardStore {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly reads: (CardListCriteria | undefined)[];
}

function createCardStore(failures = 0): CardStore {
  const reads: (CardListCriteria | undefined)[] = [];
  let remainingFailures = failures;

  return {
    cardCounter: { count: () => Promise.resolve(catalog.length) },
    cardLister: {
      getPage: (criteria) => {
        reads.push(criteria);
        if (remainingFailures > 0) {
          remainingFailures -= 1;
          return Promise.reject(STORE_FAILURE);
        }

        const offset = criteria?.offset ?? 0;
        const limit = criteria?.limit ?? catalog.length;

        return Promise.resolve(
          Page.create(catalog.slice(offset, offset + limit), offset + limit < catalog.length),
        );
      },
    },
    reads,
  };
}

async function renderCards(store: CardStore, criteria: CardListCriteria) {
  return await render(
    <CardsData cardCounter={store.cardCounter} cardLister={store.cardLister} criteria={criteria}>
      {({ cards, loadMore, total }) => (
        <>
          <Text onPress={loadMore}>Load more</Text>
          <Text>{`${cards.length} of ${total}`}</Text>
        </>
      )}
    </CardsData>,
    { wrapper: createTestWrapper() },
  );
}

describe("CardsData", () => {
  it("should render the first page and the total once the read settles", async () => {
    const store = createCardStore();

    await renderCards(store, { setCodes: [unleashed.code] });

    expect(await screen.findByText("30 of 31")).toBeTruthy();
    expect(store.reads).toHaveLength(1);
    expect(store.reads[0]).toMatchObject({ limit: PAGE_SIZE, offset: 0 });
  });

  it("should append the next page when load more is pressed", async () => {
    const store = createCardStore();
    await renderCards(store, { setCodes: [unleashed.code] });
    await screen.findByText("30 of 31");

    await fireEvent.press(screen.getByText("Load more"));

    expect(await screen.findByText("31 of 31")).toBeTruthy();
    expect(store.reads[1]).toMatchObject({ limit: PAGE_SIZE, offset: PAGE_SIZE });
  });

  it("should report a failed read and read again when the retry is pressed", async () => {
    const store = createCardStore(1);
    await renderCards(store, { setCodes: [unleashed.code] });
    await screen.findByText("Could not load cards.");

    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("30 of 31")).toBeTruthy();
  });

  it("should not read again when an equal criteria object is passed", async () => {
    const store = createCardStore();
    const { rerender } = await renderCards(store, { setCodes: [unleashed.code] });
    await screen.findByText("30 of 31");

    await rerender(
      <CardsData
        cardCounter={store.cardCounter}
        cardLister={store.cardLister}
        criteria={{ setCodes: [unleashed.code] }}
      >
        {({ cards, total }) => <Text>{`${cards.length} of ${total}`}</Text>}
      </CardsData>,
    );

    expect(store.reads).toHaveLength(1);
  });

  it("should read again when the criteria change", async () => {
    const store = createCardStore();
    const { rerender } = await renderCards(store, { setCodes: [unleashed.code] });
    await screen.findByText("30 of 31");

    await rerender(
      <CardsData
        cardCounter={store.cardCounter}
        cardLister={store.cardLister}
        criteria={{ setCodes: [unleashed.code], domainIds: ["Fury"] }}
      >
        {({ cards, total }) => <Text>{`${cards.length} of ${total}`}</Text>}
      </CardsData>,
    );

    expect(await screen.findByText("30 of 31")).toBeTruthy();
    expect(store.reads).toHaveLength(2);
    expect(store.reads[1]).toMatchObject({ domainIds: ["Fury"] });
  });
});
