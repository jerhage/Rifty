import { useRouter } from "expo-router";
import { useMemo } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
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

  return (
    <DeckBuildScreen
      cardLister={catalog.cardRepository}
      draft={build.draft}
      error={build.error}
      isPoolFilterOpen={build.isPoolFilterOpen}
      isSaving={build.isSaving}
      legendDomainIds={build.legendDomainIds}
      legendQuery={build.legendQuery}
      legendSearchQuery={build.debouncedLegendQuery}
      onBack={build.back}
      onChangeLegendQuery={build.setLegendQuery}
      onChangeName={build.changeName}
      onChangePoolQuery={build.setPoolQuery}
      onDismissPoolFilters={build.dismissPoolFilters}
      onEditStep={build.goToStep}
      onNext={build.next}
      onOpenCard={(card) => router.push({ pathname: "/cards/[id]", params: { id: card.id } })}
      onOpenPoolFilters={build.openPoolFilters}
      onPickChampion={build.pickChampion}
      onPickLegend={build.pickLegend}
      onResetPoolFilters={build.resetPoolFilters}
      onSave={() => void build.save()}
      onSelectZone={build.setZone}
      onSetQuantity={build.setQuantity}
      onToggleLegendDomain={build.toggleLegendDomain}
      onTogglePoolDomain={build.togglePoolDomain}
      onTogglePoolType={build.togglePoolType}
      poolFilters={build.poolFilters}
      poolSearchFilters={build.poolQueryFilters}
      step={build.step}
      stepIndex={build.stepIndex}
      verification={build.verification}
      zone={build.zone}
    />
  );
}

export default DeckBuildRoute;
