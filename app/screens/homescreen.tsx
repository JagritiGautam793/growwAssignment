import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggleCompact } from "../components/ThemeToggleCompact";
import { useThemeMode } from "../contexts/ThemeContext";
import { getColors } from "../theme/colors";

interface StockData {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

interface SectionData {
  title: string;
  data: StockData[];
  type: "gainer" | "loser";
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
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

// Debounce  function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const HomeScreen = () => {
  const [gainers, setGainers] = useState<StockData[]>([]);
  const [losers, setLosers] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSelectingResult, setIsSelectingResult] = useState(false);
  const [preventBlur, setPreventBlur] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchAnimation = useState(new Animated.Value(0))[0];
  const { isDark } = useThemeMode();
  const C = getColors(isDark);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/stockdata");
        const data = await response.json();
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await fetch(
          `/search?keywords=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (data.results) {
          setSearchResults(data.results);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error("Error searching stocks:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const sections: SectionData[] = [
    { title: "Top Gainers", data: gainers.slice(0, 4), type: "gainer" },
    { title: "Top Losers", data: losers.slice(0, 4), type: "loser" },
  ];

  const handleCardPress = (symbol: string) => {
    console.log("=== REGULAR CARD PRESSED ===");
    console.log("Symbol:", symbol);
    console.log("Navigation path:", `/screens/detailscreen?symbol=${symbol}`);
    router.push(`/screens/detailscreen?symbol=${symbol}`);
    console.log("Regular card navigation completed");
  };

  const handleViewAllPress = (type: "gainer" | "loser") => {
    router.push(`/screens/stocklistscreen?type=${type}`);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setShowSearchResults(false);
      setSearchResults([]);
    }
    if (text.length === 1) {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.timing(searchAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    console.log("Search input blurred - IGNORING to keep results visible");
    setIsSearchFocused(false);
    Animated.timing(searchAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const renderStockCard = ({
    item,
    type,
  }: {
    item: StockData;
    type: "gainer" | "loser";
  }) => {
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
              {item.change_percentage})
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

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[
        styles.searchResultItem,
        { backgroundColor: C.surface, borderBottomColor: C.border },
      ]}
      onPress={() => {
        console.log("🚀 INSTANT NAVIGATION for:", item.symbol);
        router.push(`/screens/detailscreen?symbol=${item.symbol}` as any);
        setSearchQuery("");
        setShowSearchResults(false);
        setSearchResults([]);
      }}
      activeOpacity={0.6}
      delayPressIn={0}
      delayPressOut={0}
    >
      <View style={styles.searchResultContent}>
        <Text style={[styles.searchResultSymbol, { color: C.textPrimary }]}>
          {item.symbol}
        </Text>
        <Text
          style={[styles.searchResultName, { color: C.textSecondary }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.searchResultDetails, { color: C.textMuted }]}>
          {item.type} • {item.region} • {item.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAppHeader = () => (
    <View
      style={[
        styles.appHeader,
        { backgroundColor: C.surface, borderBottomColor: C.border },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={[styles.appTitle, { color: C.textPrimary }]}>
            Stocks App
          </Text>
          <Text style={[styles.appSubtitle, { color: C.textMuted }]}>
            Track your investments
          </Text>
        </View>
        <ThemeToggleCompact />
      </View>
    </View>
  );

  const renderSearchBar = () => {
    const searchContainerStyle = [
      styles.searchContainer,
      {
        backgroundColor: C.surface,
        borderBottomColor: C.border,
        shadowOpacity: searchAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.1, 0.2],
        }),
        elevation: searchAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [2, 8],
        }),
      },
    ];

    return (
      <Animated.View style={searchContainerStyle}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: C.inputBg, borderColor: C.inputBorder },
          ]}
        >
          <View style={styles.searchIconContainer}>
            <Text style={[styles.searchIcon, { color: C.textMuted }]}>⌕</Text>
          </View>
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder="Search stocks, companies..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholderTextColor={C.textMuted}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchLoading && (
            <ActivityIndicator
              size="small"
              color={C.accent}
              style={styles.searchLoading}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSearchResults = () => {
    if (!showSearchResults || searchResults.length === 0) {
      console.log("Not showing search results:", {
        showSearchResults,
        resultsCount: searchResults.length,
      });
      return null;
    }

    console.log("Rendering search results:", searchResults.length, "results");
    console.log("First result:", searchResults[0]);

    return (
      <View
        style={[
          styles.searchResultsContainer,
          {
            backgroundColor: C.surface,
            borderBottomColor: C.border,
          },
        ]}
      >
        <View
          style={[
            styles.searchResultsHeader,
            { backgroundColor: C.surface, borderBottomColor: C.border },
          ]}
        >
          <Text style={[styles.searchResultsTitle, { color: C.textMuted }]}>
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}{" "}
            found
          </Text>
        </View>
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.symbol}
          showsVerticalScrollIndicator={false}
          style={styles.searchResultsList}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        />
      </View>
    );
  };

  const renderSection = ({ item: section }: { item: SectionData }) => (
    <View style={styles.section}>
      <View style={styles.sectionTitleContainer}>
        <Text style={[styles.sectionHeader, { color: C.textPrimary }]}>
          {section.title}
        </Text>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: C.accent }]}
          onPress={() => handleViewAllPress(section.type)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.viewAllText,
              { color: isDark ? C.textPrimary : C.surface },
            ]}
          >
            View All
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={section.data}
        renderItem={({ item }) => renderStockCard({ item, type: section.type })}
        keyExtractor={(item) => item.ticker}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={[styles.loadingText, { color: C.textMuted }]}>
          Loading market data...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: C.background,
        },
      ]}
    >
      {renderAppHeader()}
      {renderSearchBar()}
      {renderSearchResults()}
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        style={styles.mainContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100, // Extra padding for tab bar
  },
  appHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: -0.3,
    flex: 1,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    minHeight: 140,
    justifyContent: "space-between",
  },
  cardHeader: {
    marginBottom: 12,
  },
  ticker: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "left",
  },
  priceSection: {
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 16,
    fontWeight: "400",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    margin: 0,
  },
  searchLoading: {
    marginLeft: 12,
  },
  searchResultsContainer: {
    borderBottomWidth: 0.5,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    minHeight: 70,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultSymbol: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 20,
  },
  searchResultDetails: {
    fontSize: 13,
    fontWeight: "500",
  },
});

export default HomeScreen;
