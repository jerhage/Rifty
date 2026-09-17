import { View, type ViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
};

function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? "background"] }, style]} {...otherProps} />;
}

export { ThemedView };
export type { ThemedViewProps };
