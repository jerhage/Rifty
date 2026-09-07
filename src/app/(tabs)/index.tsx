import { useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardsData } from "@/features/catalog/presentation/data/cards-data";
import { CardCatalogScreen } from "@/features/catalog/presentation/screens/card-catalog-screen";

function HomeScreen() {
  const { catalog } = useAppDependencies();
  const router = useRouter();

  return (
    <CardsData cardSummaryLister={catalog.cards}>
      {(content) => (
        <CardCatalogScreen
          {...content}
          onSelectCard={(id) => router.push({ pathname: "/cards/[id]", params: { id } })}
        />
      )}
    </CardsData>
  );
}

export default HomeScreen;
