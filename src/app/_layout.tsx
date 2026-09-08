import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/app-shell/animated-icon";
import { AppDependenciesProvider } from "@/composition/app-dependencies-provider";

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppDependenciesProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="cards/[id]" options={{ title: "Card" }} />
          <Stack.Screen
            name="decks/build"
            options={{ headerShown: false, presentation: "modal" }}
          />
        </Stack>
      </AppDependenciesProvider>
    </ThemeProvider>
  );
}

export default RootLayout;
