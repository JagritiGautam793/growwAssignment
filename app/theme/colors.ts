export const getColors = (isDark: boolean) => {
  if (isDark) {
    return {
      background: "#000000",
      surface: "#121212",
      card: "#1c1c1e",
      border: "#2c2c2e",
      textPrimary: "#ffffff",
      textSecondary: "#c7c7cc",
      textMuted: "#8e8e93",
      accent: "#0A84FF",
      positive: "#34C759",
      negative: "#FF3B30",
      inputBg: "#1c1c1e",
      inputBorder: "#2c2c2e",
    } as const;
  }

  return {
    background: "#f5f5f5",
    surface: "#ffffff",
    card: "#ffffff",
    border: "#e0e0e0",
    textPrimary: "#1C1C1E",
    textSecondary: "#48484A",
    textMuted: "#8E8E93",
    accent: "#007AFF",
    positive: "#4CAF50",
    negative: "#F44336",
    inputBg: "#F2F2F7",
    inputBorder: "#E5E5EA",
  } as const;
};


