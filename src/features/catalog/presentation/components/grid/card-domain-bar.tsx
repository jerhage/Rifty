import { StyleSheet, View } from "react-native";

import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import { useDomainColors } from "@/hooks/use-theme";

/**
 * A card's domains as one bar along the bottom edge of its art. A dual-domain card splits the bar
 * evenly so both colors read at a glance, rather than one standing in for the pair.
 */
function CardDomainBar({ domainIds }: { readonly domainIds: readonly CardDomain[] }) {
  const domainColors = useDomainColors();

  if (domainIds.length === 0) return null;

  return (
    <View style={styles.bar}>
      {domainIds.map((domainId) => (
        <View
          key={domainId}
          style={[styles.segment, { backgroundColor: domainColors[domainId] }]}
        />
      ))}
    </View>
  );
}

export { CardDomainBar };

const styles = StyleSheet.create({
  bar: {
    bottom: 0,
    flexDirection: "row",
    height: 3,
    left: 0,
    position: "absolute",
    right: 0,
  },
  segment: {
    flex: 1,
    height: "100%",
  },
});
