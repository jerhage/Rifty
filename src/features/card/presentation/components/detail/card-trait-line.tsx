import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";

import { formatTaxonomyId } from "../../card-taxonomy-format";

function CardTraitLine({ tagIds }: { readonly tagIds: readonly string[] }) {
  if (tagIds.length === 0) return null;

  return (
    <ThemedText themeColor="textSecondary" type="mono" style={styles.line}>
      {tagIds.map((tagId) => formatTaxonomyId(tagId)).join(" · ")}
    </ThemedText>
  );
}

export { CardTraitLine };

const styles = StyleSheet.create({
  line: {
    marginTop: Spacing.two - 1,
  },
});
