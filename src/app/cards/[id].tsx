import { useLocalSearchParams } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardDetailData } from "@/features/card/presentation/data/card-detail-data";
import { CardDetailScreen } from "@/features/card/presentation/screens/card-detail-screen";

function CardDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards } = useAppDependencies();

  return (
    <CardDetailData cardFinder={cards.cardRepository} cardId={id}>
      {(card) => <CardDetailScreen card={card} />}
    </CardDetailData>
  );
}

export default CardDetailRoute;
