import { useRouter } from "expo-router";
import { useMemo } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import { CardsData } from "@/features/catalog/presentation/data/cards-data";
import { riftboundStandard, verifyDeck } from "@/features/deck/deck/deck-legality";
import { draftEntries } from "@/features/deck/presentation/deck-build-steps";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";
import { DeckBuildScreen } from "@/features/deck/presentation/screens/deck-build-screen";

const BUILD_PAGE_SIZE = 60;

function DeckBuildRoute() {
  const { catalog } = useAppDependencies();
  const legendLister = useMemo(
    () => ({
      getSummaryPage: (pagination: { limit: number; offset: number }, options?: object) =>
        catalog.cardRepository.getSummaryPage(
          { ...pagination, typeIds: ["Legend"], limit: BUILD_PAGE_SIZE },
          options,
        ),
    }),
    [catalog.cardRepository],
  );
  const championLister = useMemo(
    () => ({
      getSummaryPage: (pagination: { limit: number; offset: number }, options?: object) =>
        catalog.cardRepository.getSummaryPage(
          { ...pagination, supertypeIds: ["Champion"], limit: BUILD_PAGE_SIZE },
          options,
        ),
    }),
    [catalog.cardRepository],
  );

  return (
    <CardsData cardSummaryLister={legendLister}>
      {({ cards: legends }) => (
        <CardsData cardSummaryLister={championLister}>
          {({ cards: champions }) => <DeckBuild champions={champions} legends={legends} />}
        </CardsData>
      )}
    </CardsData>
  );
}

function DeckBuild({
  champions,
  legends,
}: {
  readonly champions: readonly CardSummary[];
  readonly legends: readonly CardSummary[];
}) {
  const router = useRouter();
  const { clock, decks, idGenerator } = useAppDependencies();
  const capabilities = useMemo(
    () => ({
      clock,
      deckFinder: decks.deckRepository,
      deckLister: decks.deckRepository,
      deckSaver: decks.deckRepository,
      idGenerator,
    }),
    [clock, decks.deckRepository, idGenerator],
  );
  const build = useDeckBuild(capabilities, () => router.back());

  const verification = useMemo(
    () =>
      verifyDeck(
        {
          id: "draft",
          name: build.draft.name || "Draft",
          notes: "",
          createdAt: "1970-01-01T00:00:00.000Z",
          updatedAt: "1970-01-01T00:00:00.000Z",
          entries: draftEntries(build.draft),
        },
        riftboundStandard,
      ),
    [build.draft],
  );

  return (
    <DeckBuildScreen
      champions={champions}
      draft={build.draft}
      error={build.error}
      isLastStep={build.isLastStep}
      isSaving={build.isSaving}
      legends={legends}
      onBack={build.back}
      onChangeName={build.changeName}
      onNext={build.next}
      onPickChampion={build.pickChampion}
      onPickLegend={build.pickLegend}
      onSave={() => void build.save()}
      step={build.step}
      stepIndex={build.stepIndex}
      verification={verification}
    />
  );
}

export default DeckBuildRoute;
