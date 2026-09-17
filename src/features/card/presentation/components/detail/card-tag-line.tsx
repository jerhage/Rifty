import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CardTaxonomy } from "@/features/card/card";

function CardTagLine({ tags }: { readonly tags: readonly CardTaxonomy[] }) {
  if (tags.length === 0) return null;

  const names = tags.map((tag) => tag.name);

  return (
    <ThemedText
      accessibilityLabel={names.join(", ")}
      themeColor="textSecondary"
      type="mono"
      style={styles.line}
    >
      {names.join(" · ")}
    </ThemedText>
  );
}

export { CardTagLine };

const styles = StyleSheet.create({
  line: {
    marginTop: Spacing.two - 1,
  },
});
