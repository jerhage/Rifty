import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { match } from "ts-pattern";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { KeywordsData } from "@/features/card/presentation/data/keywords-data";
import { MissingDeck } from "@/features/deck/presentation/components/missing-deck";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckBuilder } from "@/features/deck/presentation/deck-builder";
import { deckToBuild } from "@/features/deck/presentation/deck-to-build";

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
        match(deckToBuild(deckId))
          .with({ type: "newDeck" }, () => (
            <DeckBuilder
              capabilities={capabilities}
              cardCounter={cardDependencies.cardRepository}
              cardLister={cardDependencies.cardRepository}
              keywords={keywords}
              mode={{ type: "create" }}
              onExit={goBack}
              onOpenCard={openCard}
              onSaved={goBack}
            />
          ))
          .with({ type: "unknownDeck" }, () => <MissingDeck />)
          .with({ type: "savedDeck" }, ({ deckId: editedDeckId }) => (
            <DeckDetailData
              cardByCardIdFinder={cardDependencies.cardRepository}
              cardsByPrintingIdsFinder={cardDependencies.cardRepository}
              deckFinder={decks.deckRepository}
              deckId={editedDeckId}
            >
              {({ resolvedDeck }) => (
                <DeckBuilder
                  capabilities={capabilities}
                  cardCounter={cardDependencies.cardRepository}
                  cardLister={cardDependencies.cardRepository}
                  keywords={keywords}
                  mode={{ type: "edit", resolvedDeck }}
                  onExit={goBack}
                  onOpenCard={openCard}
                  onSaved={goBack}
                />
              )}
            </DeckDetailData>
          ))
          .exhaustive()
      }
    </KeywordsData>
  );
}

export default DeckBuildRoute;
