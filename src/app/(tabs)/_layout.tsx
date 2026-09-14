import { Tabs } from "expo-router";

import { TabGlyph } from "@/components/ui/icons/tab-glyph";
import { Fonts, RailWidth } from "@/constants/theme";
import { useLayoutSize } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";
import { UsableWidthProvider } from "@/hooks/use-usable-width";

function TabsLayout() {
  const theme = useTheme();
  const { layoutClass, usableWidth } = useLayoutSize();
  const isRail = layoutClass === "tablet";

  return (
    <UsableWidthProvider width={usableWidth - (isRail ? RailWidth : 0)}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textTertiary,
          ...(isRail ? { tabBarLabelPosition: "below-icon" as const } : {}),
          tabBarLabelStyle: {
            fontFamily: Fonts.mono,
            fontSize: 10.5,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          },
          tabBarPosition: isRail ? "left" : "bottom",
          tabBarStyle: isRail
            ? {
                backgroundColor: theme.background,
                borderColor: theme.border,
                width: RailWidth,
              }
            : {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
              },
          tabBarVariant: isRail ? "material" : "uikit",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarItemStyle: isRail ? { marginTop: "auto" } : undefined,
            title: "Cards",
            tabBarIcon: ({ color }) => <TabGlyph color={color} shape="square" />,
          }}
        />
        <Tabs.Screen
          name="decks"
          options={{
            tabBarItemStyle: isRail ? { marginBottom: "auto" } : undefined,
            title: "Decks",
            tabBarIcon: ({ color }) => <TabGlyph color={color} shape="diamond" />,
          }}
        />
      </Tabs>
    </UsableWidthProvider>
  );
}

export default TabsLayout;
