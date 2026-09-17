import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { TaxonomyId } from "@/features/card/value-objects/taxonomy-id";

import { formatTaxonomyId } from "../../card-taxonomy-format";

function CardTagLine({ tagIds }: { readonly tagIds: readonly TaxonomyId[] }) {
  if (tagIds.length === 0) return null;

  const tags = tagIds.map((tagId) => formatTaxonomyId(tagId));

  return (
    <ThemedText
      accessibilityLabel={tags.join(", ")}
      themeColor="textSecondary"
      type="mono"
      style={styles.line}
    >
      {tags.join(" · ")}
    </ThemedText>
  );
}

export { CardTagLine };

const styles = StyleSheet.create({
  line: {
    marginTop: Spacing.two - 1,
  },
});
