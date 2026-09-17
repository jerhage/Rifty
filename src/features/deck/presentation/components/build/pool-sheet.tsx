import { View } from "react-native";
import { match } from "ts-pattern";

import { BottomSheetShell } from "@/components/ui/atoms/bottom-sheet-shell";
import type { CardSort } from "@/features/card/card-list-criteria";
import type { Keyword } from "@/features/card/keyword/keyword";
import { CardSortFace } from "@/features/card/presentation/components/card-sort-face";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";

import type { SectionPoolFilters } from "../../deck-section-pool";
import type { SectionPoolSheetState } from "../../hooks/use-section-pool";
import { PoolFilterFace } from "./pool-filter-face";

/** One sheet with two faces, chosen by the state the section pool holds. */
function PoolSheet({
  filters,
  keywords,
  onApplyFilters,
  onApplySort,
  onChangeSort,
  onDismiss,
  onReset,
  onToggleDomain,
  onToggleKeyword,
  onToggleType,
  sheet,
  sort,
  section,
}: {
  readonly filters: SectionPoolFilters;
  readonly keywords: readonly Keyword[];
  readonly onApplyFilters: () => void;
  readonly onApplySort: () => void;
  readonly onChangeSort: (sort: CardSort) => void;
  readonly onDismiss: () => void;
  readonly onReset: () => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleKeyword: (keywordId: string) => void;
  readonly onToggleType: (typeId: CardType) => void;
  readonly sheet: SectionPoolSheetState;
  readonly sort: CardSort;
  readonly section: DeckSection;
}) {
  return (
    <BottomSheetShell isPresented={sheet.type !== "hidden"} onDismiss={onDismiss}>
      {match(sheet)
        .with({ type: "hidden" }, () => <View />)
        .with({ type: "sort" }, () => (
          <CardSortFace onApply={onApplySort} onChangeSort={onChangeSort} sort={sort} />
        ))
        .with({ type: "filter" }, () => (
          <PoolFilterFace
            filters={filters}
            keywords={keywords}
            onApply={onApplyFilters}
            onReset={onReset}
            onToggleDomain={onToggleDomain}
            onToggleKeyword={onToggleKeyword}
            onToggleType={onToggleType}
            section={section}
          />
        ))
        .exhaustive()}
    </BottomSheetShell>
  );
}

export { PoolSheet };
