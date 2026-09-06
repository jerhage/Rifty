import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardCatalogScreen } from "@/features/catalog/presentation/card-catalog-screen";
import { CardsData } from "@/features/catalog/presentation/cards-data";

function HomeScreen() {
  const { catalog } = useAppDependencies();

  return (
    <CardsData cardLister={catalog.cards}>
      {(content) => <CardCatalogScreen {...content} />}
    </CardsData>
  );
}

export default HomeScreen;
