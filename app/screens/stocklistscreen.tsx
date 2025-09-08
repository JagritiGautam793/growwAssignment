import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeMode } from "../contexts/ThemeContext";
import { getColors } from "../theme/colors";

interface StockData {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 50) / 2;

const formatVolume = (volume: string): string => {
  const num = parseFloat(volume);
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const StockListScreen = () => {
  const { type } = useLocalSearchParams<{ type: "gainer" | "loser" }>();
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeMode();
  const C = getColors(isDark);

  const itemsPerPage = 20;

  const fetchStocks = useCallback(
    async (pageNum: number, isLoadMore = false) => {
      try {
        if (!isLoadMore) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(
          `/stockdata?type=${type}&page=${pageNum}&limit=${itemsPerPage}`
        );
        const data = await response.json();

        const stockData =
          type === "gainer" ? data.gainers || [] : data.losers || [];

        if (isLoadMore) {
          setStocks((prev) => [...prev, ...stockData]);
        } else {
          setStocks(stockData);
        }

        setHasMore(stockData.length === itemsPerPage);
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [type, itemsPerPage]
  );

  useEffect(() => {
    if (type) {
      fetchStocks(1);
    }
  }, [type, fetchStocks]);

  const handleCardPress = (symbol: string) => {
    router.push(`/screens/detailscreen?symbol=${symbol}`);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchStocks(nextPage, true);
    }
  };

  const renderStockCard = ({ item }: { item: StockData }) => {
    const isPositive = parseFloat(item.change_percentage) >= 0;
    const changeColor = type === "gainer" ? C.positive : C.negative;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { width: CARD_WIDTH, backgroundColor: C.card, borderColor: C.border },
        ]}
        onPress={() => handleCardPress(item.ticker)}
        activeOpacity={0.7}
      >
        {/* Header with ticker symbol */}
        <View style={styles.cardHeader}>
          <Text
            style={[styles.ticker, { color: C.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.ticker}
          </Text>
        </View>

        {/* Price section */}
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: C.textPrimary }]}>
            ${parseFloat(item.price).toFixed(2)}
          </Text>
        </View>

        {/* Performance indicators */}
        <View style={styles.performanceSection}>
          <View style={styles.changeContainer}>
            <Text style={[styles.changeAmount, { color: changeColor }]}>
              {isPositive ? "+" : ""}$
              {Math.abs(parseFloat(item.change_amount)).toFixed(2)}
            </Text>
            <Text style={[styles.changePercentage, { color: changeColor }]}>
              ({isPositive ? "+" : ""}
              {item.change_percentage}%)
            </Text>
          </View>
        </View>

        {/* Volume info */}
        <View style={styles.volumeSection}>
          <Text style={[styles.volumeLabel, { color: C.textMuted }]}>
            Volume
          </Text>
          <Text style={[styles.volume, { color: C.textSecondary }]}>
            {formatVolume(item.volume)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={C.accent} />
        <Text style={[styles.loadingText, { color: C.textMuted }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: C.surface, borderBottomColor: C.border },
      ]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={[styles.backButtonText, { color: C.accent }]}>‹</Text>
      </TouchableOpacity>
      <Text
        style={[styles.headerTitle, { color: C.textPrimary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {type === "gainer" ? "Top Gainers" : "Top Losers"}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={[styles.container, { backgroundColor: C.background }]}>
          {renderHeader()}
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={[styles.loadingText, { color: C.textMuted }]}>
              Loading stocks...
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor: C.background,
          },
        ]}
      >
        {renderHeader()}
        <FlatList
          data={stocks}
          renderItem={renderStockCard}
          keyExtractor={(item, index) => `${item.ticker}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 60,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 44,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 140,
    justifyContent: "space-between",
  },
  cardHeader: {
    marginBottom: 12,
  },
  ticker: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    letterSpacing: 0.5,
    textAlign: "left",
  },
  priceSection: {
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    letterSpacing: -0.5,
  },
  performanceSection: {
    marginBottom: 12,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  changeAmount: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  changePercentage: {
    fontSize: 13,
    fontWeight: "600",
  },
  volumeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  volumeLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  volume: {
    fontSize: 13,
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default StockListScreen;
