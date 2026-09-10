import { View } from "react-native";
import { match } from "ts-pattern";

import { BottomSheetShell } from "@/components/ui/atoms/bottom-sheet-shell";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { CardSet } from "@/features/set/card-set";

import type { CatalogQueryCriteria } from "../../catalog-query-criteria";
import type { CatalogSheetState } from "../../hooks/use-catalog-query";
import { CatalogFilterFace } from "./catalog-filter-face";
import { CatalogSortFace } from "./catalog-sort-face";

/** One sheet with two faces, chosen by the state the catalog query holds. */
function CardCatalogFilterSheet({
  cardSets,
  criteria,
  keywords,
  onApply,
  onChangeCriteria,
  onClear,
  onDismiss,
  sheet,
}: {
  readonly cardSets: readonly CardSet[];
  readonly criteria: CatalogQueryCriteria;
  readonly keywords: readonly Keyword[];
  readonly onApply: () => void;
  readonly onChangeCriteria: (criteria: CatalogQueryCriteria) => void;
  readonly onClear: () => void;
  readonly onDismiss: () => void;
  readonly sheet: CatalogSheetState;
}) {
  return (
    <BottomSheetShell isPresented={sheet.type !== "hidden"} onDismiss={onDismiss}>
      {match(sheet)
        .with({ type: "hidden" }, () => <View />)
        .with({ type: "sort" }, () => (
          <CatalogSortFace
            criteria={criteria}
            onApply={onApply}
            onChangeCriteria={onChangeCriteria}
          />
        ))
        .with({ type: "filter" }, () => (
          <CatalogFilterFace
            cardSets={cardSets}
            criteria={criteria}
            keywords={keywords}
            onApply={onApply}
            onChangeCriteria={onChangeCriteria}
            onClear={onClear}
          />
        ))
        .exhaustive()}
    </BottomSheetShell>
  );
}

export { CardCatalogFilterSheet };
