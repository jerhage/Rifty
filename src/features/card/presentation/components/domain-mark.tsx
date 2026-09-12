import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { domainCode } from "../card-taxonomy-format";

/**
 * Where a mark sits: `segment` shares a bar with its siblings, `tag` stands on its own beside text.
 */
type DomainMarkLayout = "segment" | "tag";

/**
 * One domain as its color *and* its letter. Several of the seven domains are the same color under a
 * common color vision deficiency, so the letter is what tells them apart; it is drawn on the
 * domain's own fill rather than on the card art, which keeps it legible over any image.
 */
function DomainMark({
  domainId,
  layout,
}: {
  readonly domainId: CardDomain;
  readonly layout: DomainMarkLayout;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.mark,
        match(layout)
          .with("segment", () => styles.segment)
          .with("tag", () => styles.tag)
          .exhaustive(),
        { backgroundColor: domainColors[domainId] },
      ]}
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
        <DomainMark domainId={domainId} key={domainId} layout="tag" />
      ))}
    </View>
  );
}

export { DomainMark, DomainMarks };
export type { DomainMarkLayout };

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flex: 1,
  },
  tag: {
    borderRadius: 3,
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
