import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { CardRepository } from "@/features/catalog/card/card-repository";
import type { SetRepository } from "@/features/catalog/set/set-repository";
import type { DeckRepository } from "@/features/deck/deck/deck-repository";
import { openAppDataStore } from "@/infrastructure/database/open-app-data-store";
import { CryptoIdGenerator } from "@/infrastructure/identity/crypto-id-generator";
import { ConsoleLogger } from "@/infrastructure/logging/console-logger";
import { SystemClock } from "@/infrastructure/time/system-clock";
import { withQueryLogging } from "@/infrastructure/logging/with-query-logging";

interface CatalogDependencies {
  readonly cardRepository: CardRepository;
  readonly setRepository: SetRepository;
}

interface DeckDependencies {
  readonly deckRepository: DeckRepository;
}

interface AppDependencies {
  readonly catalog: CatalogDependencies;
  readonly clock: Clock;
  readonly decks: DeckDependencies;
  readonly idGenerator: IdGenerator;
}

async function createAppDependencies(): Promise<AppDependencies> {
  const logger = new ConsoleLogger();
  const store = await openAppDataStore(logger);
  return {
    catalog: {
      cardRepository: withQueryLogging(store.catalog.cards, logger, "CardRepository"),
      setRepository: withQueryLogging(store.catalog.sets, logger, "SetRepository"),
    },
    clock: new SystemClock(),
    decks: {
      deckRepository: withQueryLogging(store.decks.repository, logger, "DeckRepository"),
    },
    idGenerator: new CryptoIdGenerator(),
  };
}

export { createAppDependencies };
export type { AppDependencies, CatalogDependencies, DeckDependencies };
