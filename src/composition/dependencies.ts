import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { RandomSource } from "@/application/ports/random-source";
import type { CardRepository } from "@/features/card/card-repository";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";
import type { SetRepository } from "@/features/catalog/set/set-repository";
import type { DeckRepository } from "@/features/deck/deck/deck-repository";
import { openAppDataStore } from "@/infrastructure/database/open-app-data-store";
import { CryptoIdGenerator } from "@/infrastructure/identity/crypto-id-generator";
import { ConsoleLogger } from "@/infrastructure/logging/console-logger";
import { MathRandomSource } from "@/infrastructure/random/math-random-source";
import { SystemClock } from "@/infrastructure/time/system-clock";
import { withQueryLogging } from "@/infrastructure/logging/with-query-logging";

interface CatalogDependencies {
  readonly cardRepository: CardRepository;
  readonly keywordLister: KeywordLister;
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
  readonly randomSource: RandomSource;
}

async function createAppDependencies(): Promise<AppDependencies> {
  const logger = new ConsoleLogger();
  const store = await openAppDataStore(logger);
  return {
    catalog: {
      cardRepository: withQueryLogging(store.catalog.cards, logger, "CardRepository"),
      keywordLister: withQueryLogging(store.catalog.keywords, logger, "KeywordLister"),
      setRepository: withQueryLogging(store.catalog.sets, logger, "SetRepository"),
    },
    clock: new SystemClock(),
    decks: {
      deckRepository: withQueryLogging(store.decks.repository, logger, "DeckRepository"),
    },
    idGenerator: new CryptoIdGenerator(),
    randomSource: new MathRandomSource(),
  };
}

export { createAppDependencies };
export type { AppDependencies, CatalogDependencies, DeckDependencies };
