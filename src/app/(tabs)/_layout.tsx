import { Tabs } from "expo-router";

import { TAB_DESTINATIONS, railCenteringStyle } from "@/components/app-shell/tab-destinations";
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
        {TAB_DESTINATIONS.map((destination, at) => (
          <Tabs.Screen
            key={destination.name}
            name={destination.name}
            options={{
              tabBarItemStyle: isRail ? railCenteringStyle(at) : undefined,
              title: destination.title,
              tabBarIcon: ({ color }) => <TabGlyph color={color} identity={destination.identity} />,
            }}
          />
        ))}
      </Tabs>
    </UsableWidthProvider>
  );
}

export default TabsLayout;
