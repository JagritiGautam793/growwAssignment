import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
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

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 30) / 2; // 30 for padding and gap

const HomeScreen = () => {
  const [gainers, setGainers] = useState<StockData[]>([]);
  const [losers, setLosers] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
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

  const sections: SectionData[] = [
    { title: "Top Gainers", data: gainers, type: "gainer" },
    { title: "Top Losers", data: losers, type: "loser" },
  ];

  const handleCardPress = (symbol: string) => {
    router.push(`/screens/detailscreen?symbol=${symbol}`);
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
});

export default HomeScreen;
