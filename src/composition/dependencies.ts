import type { CardRepository } from "@/features/catalog/card/card-repository";
import type { SetRepository } from "@/features/catalog/set/set-repository";
import { openCatalogDataStore } from "@/infrastructure/database/open-catalog-data-store";
import { ConsoleLogger } from "@/infrastructure/logging/console-logger";
import { withQueryLogging } from "@/infrastructure/logging/with-query-logging";

interface CatalogDependencies {
  readonly cardRepository: CardRepository;
  readonly setRepository: SetRepository;
}

interface AppDependencies {
  readonly catalog: CatalogDependencies;
}

async function createAppDependencies(): Promise<AppDependencies> {
  const logger = new ConsoleLogger();
  const store = await openCatalogDataStore(logger);
  return {
    catalog: {
      cardRepository: withQueryLogging(store.cards, logger, "CardRepository"),
      setRepository: withQueryLogging(store.sets, logger, "SetRepository"),
    },
  };
}

export { createAppDependencies };
export type { AppDependencies, CatalogDependencies };
