import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useWatchlist } from "../contexts/WatchlistContext";

interface Watchlist {
  id: number;
  name: string;
  createdAt: string | null;
}

interface Company {
  id: number;
  symbol: string;
  name: string;
  watchlistId: number;
  addedAt: string;
}

const WatchlistScreen = () => {
  const {
    watchlists,
    companies,
    selectedWatchlist,
    loading,
    setSelectedWatchlist,
    removeCompanyFromWatchlist,
  } = useWatchlist();
  const router = useRouter();

  const handleWatchlistPress = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
  };

  const handleCompanyPress = (symbol: string) => {
    router.push(`/screens/detailscreen?symbol=${symbol}`);
  };

  const handleRemoveCompany = async (companyId: number) => {
    try {
      await removeCompanyFromWatchlist(companyId);
    } catch (error) {
      console.error("Error removing company:", error);
    }
  };

  const renderWatchlistItem = ({ item }: { item: Watchlist }) => (
    <TouchableOpacity
      style={[
        styles.watchlistItem,
        selectedWatchlist?.id === item.id && styles.selectedWatchlistItem,
      ]}
      onPress={() => handleWatchlistPress(item)}
    >
      <Text style={styles.watchlistItemText}>{item.name}</Text>
      {selectedWatchlist?.id === item.id && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={styles.companyItem}
      onPress={() => handleCompanyPress(item.symbol)}
    >
      <View style={styles.companyInfo}>
        <Text style={styles.companySymbol}>{item.symbol}</Text>
        <Text style={styles.companyName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.addedDate}>
          Added: {new Date(item.addedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveCompany(item.id)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading watchlists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Watchlists</Text>
      </View>

      {watchlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No watchlists created yet</Text>
          <Text style={styles.emptySubtext}>
            Add companies to watchlists from the details screen
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.watchlistSection}>
            <Text style={styles.sectionTitle}>Watchlists</Text>
            <FlatList
              data={watchlists}
              renderItem={renderWatchlistItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.watchlistList}
            />
          </View>

          {selectedWatchlist && (
            <View style={styles.companiesSection}>
              <Text style={styles.sectionTitle}>
                Companies in {selectedWatchlist.name}
              </Text>
              {companies.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No companies in this watchlist
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={companies}
                  renderItem={renderCompanyItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  style={styles.companiesList}
                />
              )}
            </View>
          )}
        </>
      )}
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
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  watchlistSection: {
    backgroundColor: "#fff",
    marginBottom: 10,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  watchlistList: {
    paddingHorizontal: 20,
  },
  watchlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedWatchlistItem: {
    backgroundColor: "#e3f2fd",
    borderColor: "#007AFF",
  },
  watchlistItemText: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
  },
  checkmark: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
  },
  companiesSection: {
    flex: 1,
    backgroundColor: "#fff",
  },
  companiesList: {
    flex: 1,
  },
  companyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  companyInfo: {
    flex: 1,
  },
  companySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  addedDate: {
    fontSize: 12,
    color: "#888",
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default WatchlistScreen;
