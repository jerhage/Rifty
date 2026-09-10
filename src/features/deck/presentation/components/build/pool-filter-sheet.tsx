import { BottomSheet, RNHostView } from "@expo/ui";

import type { Keyword } from "@/features/card/keyword/keyword";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

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
  readonly zone: DeckSection;
}) {
  const theme = useTheme();

  return (
    <BottomSheet
      containerColor={theme.backgroundSheet}
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["half", "full"]}
    >
      <RNHostView>
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
      </RNHostView>
    </BottomSheet>
  );
}

export { PoolFilterSheet };
