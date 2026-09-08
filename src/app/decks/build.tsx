import { useRouter } from "expo-router";
import { useMemo } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/catalog/card/card";
import { CardPoolData } from "@/features/catalog/presentation/data/card-pool-data";
import { PoolFilterSheet } from "@/features/deck/presentation/components/build/pool-filter-sheet";
import { riftboundStandard, verifyDeck } from "@/features/deck/deck/deck-legality";
import { eligibleChampions } from "@/features/deck/presentation/champion-eligibility";
import { draftEntries } from "@/features/deck/presentation/deck-build-steps";
import { matchesPoolFilters, poolCriteria } from "@/features/deck/presentation/deck-zone-pool";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";
import { DeckBuildScreen } from "@/features/deck/presentation/screens/deck-build-screen";

const POOL_LIMIT = 100;

function DeckBuildRoute() {
  const { catalog } = useAppDependencies();

  return (
    <CardPoolData
      cardLister={catalog.cardRepository}
      criteria={{ typeIds: ["Legend"], limit: POOL_LIMIT }}
    >
      {(legends) => (
        <CardPoolData
          cardLister={catalog.cardRepository}
          criteria={{ supertypeIds: ["Champion"], limit: POOL_LIMIT }}
        >
          {(champions) => <DeckBuild allChampions={champions} legends={legends} />}
        </CardPoolData>
      )}
    </CardPoolData>
  );
}

function DeckBuild({
  allChampions,
  legends,
}: {
  readonly allChampions: readonly Card[];
  readonly legends: readonly Card[];
}) {
  const router = useRouter();
  const { catalog, clock, decks, idGenerator } = useAppDependencies();
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

  const champions = useMemo(
    () => eligibleChampions(allChampions, build.draft.legend),
    [allChampions, build.draft.legend],
  );

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
    <CardPoolData
      cardLister={catalog.cardRepository}
      criteria={poolCriteria(build.zone, build.poolFilters, POOL_LIMIT)}
    >
      {(fetched) => {
        const zonePool = fetched.filter((card) => matchesPoolFilters(card, build.poolFilters));

        return (
          <>
            <DeckBuildScreen
              champions={champions}
              draft={build.draft}
              error={build.error}
              isSaving={build.isSaving}
              legends={legends}
              onBack={build.back}
              onChangeName={build.changeName}
              onChangePoolQuery={build.setPoolQuery}
              onEditStep={build.goToStep}
              onNext={build.next}
              onOpenCard={(card) =>
                router.push({ pathname: "/cards/[id]", params: { id: card.id } })
              }
              onOpenPoolFilters={build.openPoolFilters}
              onPickChampion={build.pickChampion}
              onPickLegend={build.pickLegend}
              poolFilters={build.poolFilters}
              onSave={() => void build.save()}
              onSelectZone={build.setZone}
              onSetQuantity={build.setQuantity}
              step={build.step}
              stepIndex={build.stepIndex}
              verification={verification}
              zone={build.zone}
              zonePool={zonePool}
            />
            <PoolFilterSheet
              filters={build.poolFilters}
              isPresented={build.isPoolFilterOpen}
              onDismiss={build.dismissPoolFilters}
              onReset={build.resetPoolFilters}
              onToggleDomain={build.togglePoolDomain}
              onToggleType={build.togglePoolType}
              resultLabel={zonePool.length === 1 ? "1 card" : `${zonePool.length} cards`}
              zone={build.zone}
            />
          </>
        );
      }}
    </CardPoolData>
  );
}

export default DeckBuildRoute;
