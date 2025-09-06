import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
const CARD_WIDTH = (width - 30) / 2; // 30 for padding and gap

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
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
  const router = useRouter();

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

  const handleSearchBlur = () => {
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

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search stocks..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onBlur={handleSearchBlur}
        placeholderTextColor="#999"
      />
      {searchLoading && (
        <ActivityIndicator
          size="small"
          color="#007AFF"
          style={styles.searchLoading}
        />
      )}
    </View>
  );

  const renderSearchResults = () => {
    if (!showSearchResults || searchResults.length === 0) return null;

    return (
      <View style={styles.searchResultsContainer}>
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.symbol}
          showsVerticalScrollIndicator={false}
          style={styles.searchResultsList}
        />
      </View>
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
    <View style={styles.container}>
      {renderSearchBar()}
      {renderSearchResults()}
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  searchLoading: {
    marginLeft: 10,
  },
  searchResultsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  searchResultDetails: {
    fontSize: 12,
    color: "#888",
  },
});

export default HomeScreen;
