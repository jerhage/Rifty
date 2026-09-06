import { StyleSheet } from "react-native";

import { CardSummaryCard } from "@/components/ui/card-summary-card";
import { ThemedView } from "@/components/themed-view";
import type { Card } from "@/features/catalog/card/card";

function CardDetailScreen({ card }: { readonly card: Card }) {
  return (
    <ThemedView style={styles.page}>
      <CardSummaryCard card={card} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
});

export { CardDetailScreen };
