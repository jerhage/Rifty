import type { CardRepository } from "@/features/catalog/card/card-repository";
import type { SetRepository } from "@/features/catalog/set/set-repository";
import { openCatalogDataStore } from "@/infrastructure/database/open-catalog-data-store";

interface CatalogDependencies {
  readonly cards: CardRepository;
  readonly sets: SetRepository;
}

interface AppDependencies {
  readonly catalog: CatalogDependencies;
}

async function createAppDependencies(): Promise<AppDependencies> {
  const store = await openCatalogDataStore();
  return {
    catalog: {
      cards: store.cards,
      sets: store.sets,
    },
  };
}

export { createAppDependencies };
export type { AppDependencies, CatalogDependencies };
