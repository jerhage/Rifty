import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { KeywordsData } from "@/features/card/presentation/data/keywords-data";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckBuilder } from "@/features/deck/presentation/deck-builder";

function DeckBuildRoute() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const router = useRouter();
  const { cards: cardDependencies, clock, decks, idGenerator } = useAppDependencies();

  const capabilities = useMemo(
    () => ({
      clock,
      deckLister: decks.deckRepository,
      deckSaver: decks.deckRepository,
      idGenerator,
    }),
    [clock, decks.deckRepository, idGenerator],
  );
  const openCard = useCallback(
    (card: Card) => router.push({ pathname: "/cards/[id]", params: { id: card.printingId } }),
    [router],
  );
  const goBack = useCallback(() => router.back(), [router]);

  return (
    <KeywordsData keywordLister={cardDependencies.keywordLister}>
      {(keywords) =>
        deckId ? (
          <DeckDetailData
            cardByCardIdFinder={cardDependencies.cardRepository}
            cardsByPrintingIdsFinder={cardDependencies.cardRepository}
            deckFinder={decks.deckRepository}
            deckId={deckId}
          >
            {({ resolvedDeck }) => (
              <DeckBuilder
                capabilities={capabilities}
                cardCounter={cardDependencies.cardRepository}
                cardLister={cardDependencies.cardRepository}
                keywords={keywords}
                onExit={goBack}
                onOpenCard={openCard}
                onSaved={goBack}
                start={{
                  type: "edit",
                  cards: resolvedDeck.entries.map((entry) => entry.card),
                  deck: resolvedDeck.deck,
                }}
              />
            )}
          </DeckDetailData>
        ) : (
          <DeckBuilder
            capabilities={capabilities}
            cardCounter={cardDependencies.cardRepository}
            cardLister={cardDependencies.cardRepository}
            keywords={keywords}
            onExit={goBack}
            onOpenCard={openCard}
            onSaved={goBack}
            start={{ type: "new" }}
          />
        )
      }
    </KeywordsData>
  );
}

export default DeckBuildRoute;
