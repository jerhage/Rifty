import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
// `route.state` is untyped on RouteProp; this helper is where React Navigation encapsulates it.
import { getFocusedRouteNameFromRoute } from "expo-router/build/react-navigation/core";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/app-shell/animated-splash-overlay";
import { AppDependenciesProvider } from "@/composition/app-dependencies-provider";
import { createQueryClient } from "@/composition/query-client";

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppDependenciesProvider>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={({ route }) => ({
                headerShown: false,
                title: getFocusedRouteNameFromRoute(route) === "decks" ? "Decks" : "Cards",
              })}
            />
            <Stack.Screen name="cards/[id]" options={{ title: "Card" }} />
            <Stack.Screen name="decks/[id]/index" options={{ title: "Deck" }} />
            <Stack.Screen
              name="decks/[id]/draw"
              options={{ headerShown: false, title: "Draw sim" }}
            />
            <Stack.Screen
              name="decks/build"
              options={{
                headerShown: false,
                presentation: "fullScreenModal",
                title: "Deck builder",
              }}
            />
          </Stack>
        </QueryClientProvider>
      </AppDependenciesProvider>
    </ThemeProvider>
  );
}

export default RootLayout;
