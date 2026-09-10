import { StyleSheet, View } from "react-native";

import type { CardDomain } from "@/features/card/value-objects/card-domain";
import { useDomainColors } from "@/hooks/use-theme";

/**
 * A card's domains as one bar along the bottom edge of its art. A dual-domain card splits the bar
 * evenly so both colors read at a glance, rather than one standing in for the pair.
 */
function DomainBar({
  domainIds,
  height = 3,
}: {
  readonly domainIds: readonly CardDomain[];
  readonly height?: number;
}) {
  const domainColors = useDomainColors();

  if (domainIds.length === 0) return null;

  return (
    <View style={[styles.bar, { height }]}>
      {domainIds.map((domainId) => (
        <View
          key={domainId}
          style={[styles.segment, { backgroundColor: domainColors[domainId] }]}
        />
      ))}
    </View>
  );
}

export { DomainBar };

const styles = StyleSheet.create({
  bar: {
    bottom: 0,
    flexDirection: "row",
    left: 0,
    position: "absolute",
    right: 0,
  },
  segment: {
    flex: 1,
    height: "100%",
  },
});
