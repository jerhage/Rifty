import { StyleSheet, View } from "react-native";

import type { CardDomain } from "@/features/card/value-objects/card-domain";

import { DomainMark } from "./domain-mark";

/**
 * Not in use. The lettered alternative to `DomainBar`, kept for a later trial: a card's domains as
 * one band along the bottom edge of its art, each domain filling its share of the band with its
 * color and its letter. A dual-domain card splits the band evenly so both read at
 * a glance, rather than one standing in for the pair. The band takes its height from the letter, so
 * it grows with the text size instead of clipping.
 */
function DomainBand({ domainIds }: { readonly domainIds: readonly CardDomain[] }) {
  if (domainIds.length === 0) return null;

  return (
    <View style={styles.bar}>
      {domainIds.map((domainId) => (
        <DomainMark domainId={domainId} key={domainId} layout="segment" />
      ))}
    </View>
  );
}

export { DomainBand };

const styles = StyleSheet.create({
  bar: {
    bottom: 0,
    flexDirection: "row",
    left: 0,
    position: "absolute",
    right: 0,
  },
});
