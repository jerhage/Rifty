import { useLocalSearchParams } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardDetailData } from "@/features/catalog/presentation/data/card-detail-data";
import { CardDetailScreen } from "@/features/catalog/presentation/screens/card-detail-screen";

function CardDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { catalog } = useAppDependencies();

  return (
    <CardDetailData cardFinder={catalog.cardRepository} cardId={id}>
      {(card) => <CardDetailScreen card={card} />}
    </CardDetailData>
  );
}

export default CardDetailRoute;
