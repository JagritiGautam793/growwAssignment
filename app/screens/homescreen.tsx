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
const CARD_WIDTH = (width - 50) / 2; // 50 for padding and gap (increased for better spacing)

// Debounce utility function
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchAnimation = useState(new Animated.Value(0))[0];

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

  // Debounced search function
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
    { title: "Top Gainers", data: gainers, type: "gainer" },
    { title: "Top Losers", data: losers, type: "loser" },
  ];

  const handleCardPress = (symbol: string) => {
    router.push(`/screens/detailscreen?symbol=${symbol}`);
  };

  const handleSearchResultPress = (symbol: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    router.push(`/screens/detailscreen?symbol=${symbol}`);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
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
    setIsSearchFocused(false);
    Animated.timing(searchAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    // Small delay to allow for search result selection
    setTimeout(() => {
      setShowSearchResults(false);
    }, 150);
  };

  const renderStockCard = ({
    item,
    type,
  }: {
    item: StockData;
    type: "gainer" | "loser";
  }) => {
    const isPositive = parseFloat(item.change_percentage) >= 0;
    const changeColor = type === "gainer" ? "#4CAF50" : "#F44336";

    return (
      <TouchableOpacity
        style={[styles.card, { width: CARD_WIDTH }]}
        onPress={() => handleCardPress(item.ticker)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          <Text style={[styles.changePercentage, { color: changeColor }]}>
            {isPositive ? "+" : ""}
            {item.change_percentage}%
          </Text>
        </View>

        <Text style={styles.price}>${item.price}</Text>

        <View style={styles.cardDetails}>
          <Text style={styles.changeAmount}>
            {isPositive ? "+" : ""}${item.change_amount}
          </Text>
          <Text style={styles.volume}>Vol: {item.volume}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSearchResultPress(item.symbol)}
      activeOpacity={0.7}
    >
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultSymbol}>{item.symbol}</Text>
        <Text style={styles.searchResultName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.searchResultDetails}>
          {item.type} • {item.region} • {item.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAppHeader = () => (
    <View style={styles.appHeader}>
      <Text style={styles.appTitle}>Stocks App</Text>
      <Text style={styles.appSubtitle}>Track your investments</Text>
    </View>
  );

  const renderSearchBar = () => {
    const searchContainerStyle = [
      styles.searchContainer,
      {
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
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIconContainer}>
            <Text style={styles.searchIcon}>⌕</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks, companies..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholderTextColor="#8E8E93"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchLoading && (
            <ActivityIndicator
              size="small"
              color="#007AFF"
              style={styles.searchLoading}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSearchResults = () => {
    if (!showSearchResults || searchResults.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.searchResultsContainer,
          {
            opacity: searchAnimation,
            transform: [
              {
                translateY: searchAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsTitle}>
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
        />
      </Animated.View>
    );
  };

  const renderSection = ({ item: section }: { item: SectionData }) => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
    backgroundColor: "#f5f5f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100, // Extra padding for tab bar
  },
  appHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8E8E93",
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1C1C1E",
    textAlign: "left",
    letterSpacing: -0.3,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 5, // Add horizontal padding for better spacing
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticker: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  changePercentage: {
    fontSize: 14,
    fontWeight: "600",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  changeAmount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  volume: {
    fontSize: 11,
    color: "#888",
  },
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "400",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
    paddingVertical: 0,
    margin: 0,
  },
  searchLoading: {
    marginLeft: 12,
  },
  searchResultsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
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
    borderBottomColor: "#F2F2F7",
    backgroundColor: "#FAFAFA",
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F2F2F7",
    backgroundColor: "#fff",
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultSymbol: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 15,
    color: "#48484A",
    marginBottom: 6,
    lineHeight: 20,
  },
  searchResultDetails: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
});

export default HomeScreen;
