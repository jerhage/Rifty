import { BottomSheet, RNHostView } from "@expo/ui";
import { StyleSheet, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/ui/atoms/primary-button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function NewDeckSheet({
  error,
  isPresented,
  name,
  onChangeName,
  onDismiss,
  onSubmit,
}: {
  readonly error: string | null;
  readonly isPresented: boolean;
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onDismiss: () => void;
  readonly onSubmit: () => void;
}) {
  const theme = useTheme();

  return (
    <BottomSheet
      containerColor={theme.backgroundSheet}
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["half"]}
    >
      <RNHostView>
        <View style={styles.sheet}>
          <ThemedText type="display" style={styles.title}>
            New deck
          </ThemedText>
          <TextInput
            accessibilityLabel="Deck name"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={onChangeName}
            onSubmitEditing={onSubmit}
            placeholder="Deck name"
            placeholderTextColor={theme.textTertiary}
            returnKeyType="done"
            style={[
              styles.input,
              { backgroundColor: theme.fill, borderColor: theme.border, color: theme.text },
            ]}
            value={name}
          />
          {error === null ? null : (
            <ThemedText themeColor="negative" type="body">
              {error}
            </ThemedText>
          )}
          <PrimaryButton label="Create deck" onPress={onSubmit} />
        </View>
      </RNHostView>
    </BottomSheet>
  );
}

export { NewDeckSheet };

const styles = StyleSheet.create({
  sheet: {
    gap: Spacing.three - 3,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
  },
  input: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.three - 4,
  },
});
