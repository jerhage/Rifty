import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

import { AppDependenciesProvider } from "@/composition/app-dependencies-provider";

SplashScreen.preventAutoHideAsync();

function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppDependenciesProvider>
        <AppTabs />
      </AppDependenciesProvider>
    </ThemeProvider>
  );
}

export default TabLayout;
