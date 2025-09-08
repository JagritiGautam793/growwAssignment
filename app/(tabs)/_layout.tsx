import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import { TouchableOpacity, View } from "react-native";
import { useThemeMode } from "../contexts/ThemeContext";
import { getColors } from "../theme/colors";

// Custom tab button with better press effect
const CustomTabButton = ({
  children,
  onPress,
  accessibilityState,
  ...props
}: any) => {
  const focused = accessibilityState?.selected;
  const { isDark } = useThemeMode();

  return (
    <TouchableOpacity
      {...props}
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused
            ? isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)"
            : "transparent",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
          minWidth: 60,
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeMode();
  const C = getColors(isDark);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.textPrimary,
        tabBarInactiveTintColor: C.textMuted,
        headerShown: false,
        tabBarButton: CustomTabButton,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: C.background,
          borderTopWidth: 1,
          borderTopColor: C.border,
          height:
            Platform.OS === "ios"
              ? 85 + insets.bottom
              : 80 + Math.max(insets.bottom, 0),
          paddingBottom:
            Platform.OS === "ios"
              ? insets.bottom + 5
              : Math.max(insets.bottom + 5, 15),
          paddingTop: 5,
          paddingHorizontal: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        tabBarItemStyle: {
          borderRadius: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
            marginBottom: 0,
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="list-alt"
              size={22}
              color={color}
              solid={focused}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
            marginBottom: 0,
          },
        }}
      />
    </Tabs>
  );
}
