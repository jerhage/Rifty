import { useRouter } from "expo-router";
import { useMemo } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardPoolData } from "@/features/catalog/presentation/data/card-pool-data";
import { PoolFilterSheet } from "@/features/deck/presentation/components/build/pool-filter-sheet";
import { riftboundStandard, verifyDeck } from "@/features/deck/deck/deck-legality";
import { eligibleChampions } from "@/features/deck/presentation/champion-eligibility";
import { draftEntries } from "@/features/deck/presentation/deck-build-steps";
import { legendCriteria, poolCriteria } from "@/features/deck/presentation/deck-zone-pool";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";
import { DeckBuildScreen } from "@/features/deck/presentation/screens/deck-build-screen";

function DeckBuildRoute() {
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
      criteria={legendCriteria(build.debouncedLegendQuery, build.legendDomainIds)}
    >
      {(legendPool) => (
        <CardPoolData cardLister={catalog.cardRepository} criteria={{ supertypeIds: ["Champion"] }}>
          {(championPool) => (
            <CardPoolData
              cardLister={catalog.cardRepository}
              criteria={poolCriteria(build.zone, build.poolQueryFilters)}
            >
              {(zonePool) => (
                <>
                  <DeckBuildScreen
                    champions={eligibleChampions(championPool.cards, build.draft.legend)}
                    draft={build.draft}
                    error={build.error}
                    isSaving={build.isSaving}
                    legendDomainIds={build.legendDomainIds}
                    legendQuery={build.legendQuery}
                    legends={legendPool.cards}
                    onBack={build.back}
                    onChangeLegendQuery={build.setLegendQuery}
                    onChangeName={build.changeName}
                    onChangePoolQuery={build.setPoolQuery}
                    onEditStep={build.goToStep}
                    onLoadMoreChampions={championPool.loadMore}
                    onLoadMoreLegends={legendPool.loadMore}
                    onLoadMorePool={zonePool.loadMore}
                    onNext={build.next}
                    onOpenCard={(card) =>
                      router.push({ pathname: "/cards/[id]", params: { id: card.id } })
                    }
                    onPickChampion={build.pickChampion}
                    onPickLegend={build.pickLegend}
                    onSave={() => void build.save()}
                    onSelectZone={build.setZone}
                    onOpenPoolFilters={build.openPoolFilters}
                    onSetQuantity={build.setQuantity}
                    onToggleLegendDomain={build.toggleLegendDomain}
                    poolFilters={build.poolFilters}
                    step={build.step}
                    stepIndex={build.stepIndex}
                    verification={verification}
                    zone={build.zone}
                    zonePool={zonePool.cards}
                  />
                  <PoolFilterSheet
                    filters={build.poolFilters}
                    isPresented={build.isPoolFilterOpen}
                    onDismiss={build.dismissPoolFilters}
                    onReset={build.resetPoolFilters}
                    onToggleDomain={build.togglePoolDomain}
                    onToggleType={build.togglePoolType}
                    resultLabel={
                      zonePool.cards.length === 1 ? "1 card" : `${zonePool.cards.length} cards`
                    }
                    zone={build.zone}
                  />
                </>
              )}
            </CardPoolData>
          )}
        </CardPoolData>
      )}
    </CardPoolData>
  );
}

export default DeckBuildRoute;
