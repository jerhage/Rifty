import { useLocalSearchParams } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardDetailData } from "@/features/card/presentation/data/card-detail-data";
import { CardDetailScreen } from "@/features/card/presentation/screens/card-detail-screen";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";

function CardDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards } = useAppDependencies();

  return (
    <CardDetailData cardFinder={cards.cardRepository} cardId={printingIdSchema.parse(id)}>
      {(card) => <CardDetailScreen card={card} />}
    </CardDetailData>
  );
}

export default CardDetailRoute;
