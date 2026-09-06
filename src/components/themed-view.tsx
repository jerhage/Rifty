import { View, type ViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? darkColor : lightColor;

  return (
    <View
      style={[{ backgroundColor: backgroundColor ?? theme[type ?? "background"] }, style]}
      {...otherProps}
    />
  );
}

export { ThemedView };
export type { ThemedViewProps };
