import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { BookmarkToggle } from "@/features/annotation/presentation/components/bookmark-toggle";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import { CardDetailData } from "@/features/card/presentation/data/card-detail-data";
import { CardDetailScreen } from "@/features/card/presentation/screens/card-detail-screen";
import { cardKeys } from "@/features/card/queries/card-keys";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";

function CardDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { annotations, cards, clock } = useAppDependencies();
  const queryClient = useQueryClient();
  const printingId = printingIdSchema.parse(id);

  return (
    <BookmarkedSubjectsData
      bookmarkManager={annotations.bookmarkRepository}
      clock={clock}
      kind="card"
      onBookmarksChanged={() => void queryClient.invalidateQueries({ queryKey: cardKeys.all() })}
    >
      {({ bookmarkedIds, toggleBookmark }) => (
        <CardDetailData cardFinder={cards.cardRepository} printingId={printingId}>
          {(card) => (
            <>
              <Stack.Screen options={{ title: card.name }} />
              <CardDetailScreen
                bookmarkControl={
                  <BookmarkToggle
                    bookmarked={bookmarkedIds.has(printingId)}
                    label="Bookmark"
                    onPress={() => toggleBookmark(printingId)}
                  />
                }
                card={card}
              />
            </>
          )}
        </CardDetailData>
      )}
    </BookmarkedSubjectsData>
  );
}

export default CardDetailRoute;
