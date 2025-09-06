import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface StockData {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

const HomeScreen = () => {
  const [gainers, setGainers] = useState<StockData[]>([]);
  const [losers, setLosers] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/stockdata");
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

  const renderStockCard = (item: StockData, type: "gainer" | "loser") => (
    <View
      key={item.ticker}
      style={[
        styles.card,
        type === "gainer" ? styles.gainerCard : styles.loserCard,
      ]}
    >
      <Text style={styles.ticker}>{item.ticker}</Text>
      <Text>Price: ${item.price}</Text>
      <Text>Change: {item.change_amount}</Text>
      <Text>Change %: {item.change_percentage}</Text>
      <Text>Volume: {item.volume}</Text>
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Top Gainers</Text>
      {gainers.length > 0 ? (
        gainers.map((stock) => renderStockCard(stock, "gainer"))
      ) : (
        <Text>No gainers data available.</Text>
      )}

      <Text style={styles.header}>Top Losers</Text>
      {losers.length > 0 ? (
        losers.map((stock) => renderStockCard(stock, "loser"))
      ) : (
        <Text>No losers data available.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  gainerCard: {
    borderColor: "green",
    borderWidth: 1,
  },
  loserCard: {
    borderColor: "red",
    borderWidth: 1,
  },
  ticker: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeScreen;
