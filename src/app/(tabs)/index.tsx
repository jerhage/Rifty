import { useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardCatalogScreen } from "@/features/catalog/presentation/card-catalog-screen";
import { CardsData } from "@/features/catalog/presentation/cards-data";

function HomeScreen() {
  const { catalog } = useAppDependencies();
  const router = useRouter();

  return (
    <CardsData cardLister={catalog.cards}>
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
