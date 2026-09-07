import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { Fonts, ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ThemedTextType =
  | "default"
  | "title"
  | "display"
  | "heading"
  | "body"
  | "small"
  | "smallBold"
  | "subtitle"
  | "link"
  | "linkPrimary"
  | "code"
  | "mono"
  | "monoValue";

type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

function ThemedText({ style, type = "default", themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? "text"] }, styles[type], style]} {...rest} />;
}

export { ThemedText };
export type { ThemedTextProps, ThemedTextType };

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  /** Screen titles — the design's Space Grotesk 700 at 24-26px. */
  display: {
    fontSize: 25,
    fontWeight: 700,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  /** Section headers within a screen. */
  heading: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 20,
  },
  /** The design's running body copy, a step below `default`. */
  body: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 19,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: "#3c87f7",
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
  /** Micro labels: uppercase monospace with wide tracking, used for counts and captions. */
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  /** Monospace numerals shown at reading size, for stat values. */
  monoValue: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 18,
  },
});
