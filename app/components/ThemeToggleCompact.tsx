import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useThemeMode } from "../contexts/ThemeContext";

export const ThemeToggleCompact = () => {
  const { isDark, toggle } = useThemeMode();
  return (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather
        name={isDark ? "moon" : "sun"}
        size={22}
        color={isDark ? "#ffd166" : "#333"}
      />
    </TouchableOpacity>
  );
};
