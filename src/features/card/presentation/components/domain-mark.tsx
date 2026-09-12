import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { domainCode } from "../card-taxonomy-format";

/**
 * One domain as its color *and* its letter, sized to stand beside a label. Several of the seven
 * domains are the same color under a common color vision deficiency, so the letter is what tells
 * them apart; it is drawn on the domain's own fill, which keeps it legible on any surface.
 */
function DomainMark({ domainId }: { readonly domainId: CardDomain }) {
  const theme = useTheme();
  const domainColors = useDomainColors();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.mark, { backgroundColor: domainColors[domainId] }]}
    >
      <ThemedText style={[styles.code, { color: theme.background }]} type="mono">
        {domainCode(domainId)}
      </ThemedText>
    </View>
  );
}

/** A card's domains as a short row of marks, for use beside a label rather than over card art. */
function DomainMarks({ domainIds }: { readonly domainIds: readonly CardDomain[] }) {
  if (domainIds.length === 0) return null;

  return (
    <View style={styles.marks}>
      {domainIds.map((domainId) => (
        <DomainMark domainId={domainId} key={domainId} />
      ))}
    </View>
  );
}

export { DomainMark, DomainMarks };

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    borderRadius: 3,
    justifyContent: "center",
    minWidth: 14,
    paddingHorizontal: Spacing.one - 1,
  },
  code: {
    fontWeight: 700,
    letterSpacing: 0,
  },
  marks: {
    flexDirection: "row",
    gap: Spacing.half,
  },
});
