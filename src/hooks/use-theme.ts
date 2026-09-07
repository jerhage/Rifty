/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, DomainColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function useTheme() {
  return Colors[resolvedScheme(useColorScheme())];
}

/** Accent colors keyed by catalog domain, for the current color scheme. */
function useDomainColors() {
  return DomainColors[resolvedScheme(useColorScheme())];
}

function resolvedScheme(scheme: ReturnType<typeof useColorScheme>) {
  return scheme === "dark" ? "dark" : "light";
}

export { useDomainColors, useTheme };
