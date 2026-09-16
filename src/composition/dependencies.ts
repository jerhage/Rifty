import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { RandomSource } from "@/application/ports/random-source";
import { cardImageBaseUrl } from "@/composition/card-image-host";
import type { BookmarkRepository } from "@/features/annotation/bookmark-repository";
import type { NoteRepository } from "@/features/annotation/note-repository";
import type { CardRepository } from "@/features/card/card-repository";
import type { KeywordLister } from "@/features/card/keyword/keyword-lister";
import type { DeckRepository } from "@/features/deck/deck/deck-repository";
import type { CoreRulesRepository } from "@/features/rules/core-rules-repository";
import type { SetRepository } from "@/features/set/set-repository";
import { openAppDataStore } from "@/infrastructure/database/open-app-data-store";
import { CryptoIdGenerator } from "@/infrastructure/identity/crypto-id-generator";
import { ConsoleLogger } from "@/infrastructure/logging/console-logger";
import { MathRandomSource } from "@/infrastructure/random/math-random-source";
import { SystemClock } from "@/infrastructure/time/system-clock";
import { withQueryLogging } from "@/infrastructure/logging/with-query-logging";

interface AnnotationDependencies {
  readonly bookmarkRepository: BookmarkRepository;
  readonly noteRepository: NoteRepository;
}

interface CardDependencies {
  readonly cardRepository: CardRepository;
  readonly keywordLister: KeywordLister;
}

interface DeckDependencies {
  readonly deckRepository: DeckRepository;
}

interface RulesDependencies {
  readonly coreRulesRepository: CoreRulesRepository;
}

interface SetDependencies {
  readonly setRepository: SetRepository;
}

interface AppDependencies {
  readonly annotations: AnnotationDependencies;
  readonly cards: CardDependencies;
  readonly clock: Clock;
  readonly decks: DeckDependencies;
  readonly idGenerator: IdGenerator;
  readonly randomSource: RandomSource;
  readonly rules: RulesDependencies;
  readonly sets: SetDependencies;
}

async function createAppDependencies(): Promise<AppDependencies> {
  const logger = new ConsoleLogger();
  const store = await openAppDataStore(logger, cardImageBaseUrl());
  return {
    annotations: {
      bookmarkRepository: withQueryLogging(
        store.annotations.bookmarks,
        logger,
        "BookmarkRepository",
      ),
      noteRepository: withQueryLogging(store.annotations.notes, logger, "NoteRepository"),
    },
    cards: {
      cardRepository: withQueryLogging(store.reference.cards, logger, "CardRepository"),
      keywordLister: withQueryLogging(store.reference.keywords, logger, "KeywordLister"),
    },
    clock: new SystemClock(),
    decks: {
      deckRepository: withQueryLogging(store.decks.repository, logger, "DeckRepository"),
    },
    idGenerator: new CryptoIdGenerator(),
    randomSource: new MathRandomSource(),
    rules: {
      coreRulesRepository: withQueryLogging(
        store.reference.coreRules,
        logger,
        "CoreRulesRepository",
      ),
    },
    sets: {
      setRepository: withQueryLogging(store.reference.sets, logger, "SetRepository"),
    },
  };
}

export { createAppDependencies };
export type {
  AnnotationDependencies,
  AppDependencies,
  CardDependencies,
  DeckDependencies,
  RulesDependencies,
  SetDependencies,
};
