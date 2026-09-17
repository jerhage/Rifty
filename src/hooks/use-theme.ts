/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, DomainColors, KeywordColors, SpeedColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function useTheme() {
  return Colors[resolvedScheme(useColorScheme())];
}

/** Accent colors keyed by card domain, for the current color scheme. */
function useDomainColors() {
  return DomainColors[resolvedScheme(useColorScheme())];
}

function useSpeedColors() {
  return SpeedColors[resolvedScheme(useColorScheme())];
}

function useKeywordColor(): (keywordId: string) => string {
  const scheme = resolvedScheme(useColorScheme());
  const palette: Readonly<Record<string, string | undefined>> = KeywordColors[scheme];
  const fallback = Colors[scheme].textSecondary;

  return (keywordId) => palette[keywordId] ?? fallback;
}

function resolvedScheme(scheme: ReturnType<typeof useColorScheme>) {
  return scheme === "dark" ? "dark" : "light";
}

export { useDomainColors, useKeywordColor, useSpeedColors, useTheme };
