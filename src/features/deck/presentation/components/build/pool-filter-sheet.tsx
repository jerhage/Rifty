import { BottomSheetShell } from "@/components/ui/atoms/bottom-sheet-shell";
import type { Keyword } from "@/features/card/keyword/keyword";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { ZoneSection } from "@/features/deck/deck/deck-legality";

import type { ZonePoolFilters } from "../../deck-zone-pool";
import { PoolFilterFace } from "./pool-filter-face";

function PoolFilterSheet({
  filters,
  isPresented,
  keywords,
  onApply,
  onDismiss,
  onReset,
  onToggleDomain,
  onToggleKeyword,
  onToggleType,
  zone,
}: {
  readonly filters: ZonePoolFilters;
  readonly isPresented: boolean;
  readonly keywords: readonly Keyword[];
  readonly onApply: () => void;
  readonly onDismiss: () => void;
  readonly onReset: () => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleKeyword: (keywordId: string) => void;
  readonly onToggleType: (typeId: CardType) => void;
  readonly zone: ZoneSection;
}) {
  return (
    <BottomSheetShell isPresented={isPresented} onDismiss={onDismiss}>
      <PoolFilterFace
        filters={filters}
        keywords={keywords}
        onApply={onApply}
        onReset={onReset}
        onToggleDomain={onToggleDomain}
        onToggleKeyword={onToggleKeyword}
        onToggleType={onToggleType}
        zone={zone}
      />
    </BottomSheetShell>
  );
}

export { PoolFilterSheet };
