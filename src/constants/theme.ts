/**
 * The design canvas expresses color in `oklch()`, which React Native's style engine does not parse
 * on native, so every opaque value is stored here as its sRGB hex equivalent. Translucent values
 * stay as `rgba()`, which React Native does support, so they keep compositing over whatever sits
 * behind them.
 */

import "@/global.css";

import { Platform } from "react-native";

const Colors = {
  light: {
    text: "#0B0D12",
    textSecondary: "rgba(11, 13, 18, 0.68)",
    textTertiary: "rgba(11, 13, 18, 0.6)",
    background: "#FFFFFF",
    backgroundElement: "#F4F5F8",
    backgroundSelected: "#E7E9EF",
    backgroundSheet: "#FFFFFF",
    fill: "rgba(11, 13, 18, 0.05)",
    border: "rgba(11, 13, 18, 0.1)",
    borderStrong: "rgba(11, 13, 18, 0.18)",
    accent: "#0B72E7",
    onAccent: "#FFFFFF",
    positive: "#1F9D4D",
    negative: "#D2322B",
    warning: "#B87A05",
  },
  dark: {
    text: "#F2F4F8",
    textSecondary: "rgba(242, 244, 248, 0.68)",
    textTertiary: "rgba(242, 244, 248, 0.62)",
    background: "#0B0D12",
    backgroundElement: "#14171F",
    backgroundSelected: "#1B1F28",
    backgroundSheet: "#161A23",
    fill: "rgba(255, 255, 255, 0.06)",
    border: "rgba(255, 255, 255, 0.09)",
    borderStrong: "rgba(255, 255, 255, 0.16)",
    accent: "#4DA3FF",
    onAccent: "#07080C",
    positive: "#7CDF81",
    negative: "#FD736D",
    warning: "#F0BB3B",
  },
} as const;

type Theme = (typeof Colors)[keyof typeof Colors];
type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * One accent per catalog domain, taken from Riftbound's own domain icons: Fury red, Calm green,
 * Mind blue, Body orange, Chaos purple, Order gold, with Colorless as a neutral.
 *
 * The printed colors span a wide lightness range — Chaos is far darker than Order — so each hue
 * and chroma is kept exactly while lightness is floored for the dark scheme and capped for the
 * light one. That is what makes every domain legible as text against both surfaces; the values
 * already inside the readable range are the brand colors untouched.
 */
const DomainColors = {
  light: {
    Body: "#9F5100",
    Calm: "#437831",
    Chaos: "#64428F",
    Colorless: "#5E646C",
    Fury: "#BF2120",
    Mind: "#326DA1",
    Order: "#7A6900",
  },
  dark: {
    Body: "#DA7D30",
    Calm: "#72AA60",
    Chaos: "#A785D8",
    Colorless: "#9FA5AE",
    Fury: "#F85D52",
    Mind: "#629ED5",
    Order: "#CDB53B",
  },
} as const;

const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

const MINIMUM_TOUCH_TARGET = Platform.select({ android: 48, default: 44 });

/**
 * The smallest square a control may offer a finger — 44pt from the iOS HIG, 48 from Material —
 * with `slop` giving the `hitSlop` inset that grows a face of the given size out to it.
 */
const TouchTarget = {
  minimum: MINIMUM_TOUCH_TARGET,
  slop: (faceSize: number) => Math.max(0, Math.ceil((MINIMUM_TOUCH_TARGET - faceSize) / 2)),
} as const;

/** Corner radii used by the design: chips and buttons at 12, panels at 16, sheet lip at 22. */
const Radius = {
  small: 6,
  medium: 12,
  large: 16,
  sheet: 22,
} as const;

/** Speed accents from the design, converted from oklch and darkened for the light scheme. */
const SpeedColors = {
  light: {
    normal: "#596475",
    action: "#7B6000",
    reaction: "#006EA0",
  },
  dark: {
    normal: "#B3BFD2",
    action: "#E6CA53",
    reaction: "#3CB5EB",
  },
} as const;

/** A hue per keyword, grouped by what it does. Placeholder values, tuned later. */
const KeywordColors = {
  light: {
    shield: "#006EA0",
    tank: "#1666AA",
    deflect: "#007780",
    backline: "#007491",
    assault: "#A04034",
    ganking: "#9F3D4F",
    hunt: "#9D4616",
    ambush: "#973F6E",
    burn: "#A03F3C",
    weaponmaster: "#9D3D59",
    accelerate: "#7A6100",
    "quick-draw": "#696800",
    repeat: "#855B00",
    temporary: "#915200",
    vision: "#6F4FA1",
    predict: "#5D55A9",
    empower: "#834791",
    empowered: "#8B4486",
    legion: "#475CAD",
    stun: "#007974",
    hidden: "#3860AC",
    deathknell: "#27762F",
    unique: "#007948",
  },
  dark: {
    shield: "#57CCFF",
    tank: "#7AC3FF",
    deflect: "#28D6DF",
    backline: "#37D2F2",
    assault: "#FF9C8B",
    ganking: "#FF99A7",
    hunt: "#FFA275",
    ambush: "#FC9AC9",
    burn: "#FF9B93",
    weaponmaster: "#FF99B2",
    accelerate: "#D7BD51",
    "quick-draw": "#C3C55A",
    repeat: "#E4B750",
    temporary: "#F3AE58",
    vision: "#CBAAFF",
    predict: "#B5B1FF",
    empower: "#E3A2F2",
    empowered: "#ED9EE5",
    legion: "#9DB9FF",
    stun: "#2FD8D0",
    hidden: "#8FBDFF",
    deathknell: "#86D489",
    unique: "#68D7A1",
  },
} as const;

const MaxContentWidth = 800;

export {
  Colors,
  DomainColors,
  Fonts,
  KeywordColors,
  MaxContentWidth,
  Radius,
  Spacing,
  SpeedColors,
  TouchTarget,
};
export type { Theme, ThemeColor };
