import { Tabs } from "expo-router";

import { TabGlyph } from "@/components/ui/icons/tab-glyph";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function CatalogLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Fonts.mono,
          fontSize: 10.5,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cards",
          tabBarIcon: ({ color }) => <TabGlyph color={color} shape="square" />,
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: "Decks",
          tabBarIcon: ({ color }) => <TabGlyph color={color} shape="diamond" />,
        }}
      />
    </Tabs>
  );
}

export default CatalogLayout;
