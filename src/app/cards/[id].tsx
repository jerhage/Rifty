import { useLocalSearchParams } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardDetailData } from "@/features/catalog/presentation/card-detail-data";
import { CardDetailScreen } from "@/features/catalog/presentation/card-detail-screen";

function CardDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { catalog } = useAppDependencies();

  return (
    <CardDetailData cardFinder={catalog.cards} cardId={id}>
      {(card) => <CardDetailScreen card={card} />}
    </CardDetailData>
  );
}

export default CardDetailRoute;
