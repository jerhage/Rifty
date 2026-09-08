import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";

function PoolViewPlaceholder({ message }: { readonly message: string }) {
  return (
    <View style={styles.placeholder}>
      <ThemedText themeColor="textSecondary" type="body" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
}

export { PoolViewPlaceholder };

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  message: {
    textAlign: "center",
  },
});
