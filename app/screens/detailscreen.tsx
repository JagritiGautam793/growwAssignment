import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useThemeMode } from "../contexts/ThemeContext";
import { useWatchlist } from "../contexts/WatchlistContext";
import { getColors } from "../theme/colors";

interface CompanyData {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  exchange: string;
  country: string;
  currency: string;
  website: string;
  marketCap: string;
  peRatio: string;
  pegRatio: string;
  eps: string;
  dividend: {
    perShare: string;
    yield: string;
    exDate: string;
    nextDate: string;
  };
  revenueTTM: string;
  profitMargin: string;
  quarterlyRevenueGrowth: string;
  quarterlyEarningsGrowth: string;
  beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMA": string;
  "200DayMA": string;
  analystTargetPrice: string;
  analystRatings: {
    strongBuy: string;
    buy: string;
    hold: string;
    sell: string;
    strongSell: string;
  };
}

interface InfoItem {
  label: string;
  value: string;
  type?: "currency" | "percentage" | "number" | "text";
}

interface TimeSeriesData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TimeSeriesResponse {
  symbol: string;
  timeframe: string;
  data: TimeSeriesData[];
}

interface Watchlist {
  id: number;
  name: string;
  createdAt: string | null;
}

const { width } = Dimensions.get("window");

const DetailScreen = () => {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const { isDark } = useThemeMode();
  const C = getColors(isDark);
  const { watchlists, addCompanyToWatchlist, createWatchlist } = useWatchlist();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1D");
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (symbol) {
      fetchCompanyData();
      fetchTimeSeriesData();
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchTimeSeriesData();
    }
  }, [selectedTimeframe]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/company?symbol=${symbol}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      setCompanyData(data);
    } catch (err) {
      console.error("Error fetching company data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch company data"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      setChartLoading(true);
      setChartError(null);
      const response = await fetch(
        `/timeseries?symbol=${symbol}&timeframe=${selectedTimeframe}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch time series data: ${response.status}`);
      }

      const data: TimeSeriesResponse = await response.json();

      // Log data received (uncomment for debugging)
      // console.log(`Received ${selectedTimeframe} data for ${symbol}:`, {
      //   dataLength: data.data?.length || 0,
      //   timeframe: data.timeframe
      // });

      setTimeSeriesData(data.data || []);
    } catch (err) {
      console.error("Error fetching time series data:", err);
      setChartError(
        err instanceof Error ? err.message : "Failed to fetch time series data"
      );
    } finally {
      setChartLoading(false);
    }
  };

  const handleBookmarkPress = () => {
    setShowWatchlistModal(true);
  };

  const handleCreateWatchlist = async () => {
    if (newWatchlistName.trim()) {
      try {
        const newWatchlist = await createWatchlist(newWatchlistName.trim());
        setNewWatchlistName("");
        setSelectedWatchlistId(newWatchlist.id);
      } catch (error) {
        console.error("Error creating watchlist:", error);
        Alert.alert("Error", "Failed to create watchlist");
      }
    }
  };

  const handleAddToWatchlist = async (watchlistId: number) => {
    if (!companyData) return;

    try {
      await addCompanyToWatchlist({
        symbol: companyData.symbol,
        name: companyData.name,
        watchlistId: watchlistId,
      });

      Alert.alert("Success", "Company added to watchlist!");
      setShowWatchlistModal(false);
      setSelectedWatchlistId(null);
    } catch (error) {
      console.error("Error adding company to watchlist:", error);
      Alert.alert("Error", "Failed to add company to watchlist");
    }
  };

  const formatValue = (value: string, type: string = "text") => {
    if (!value || value === "None" || value === "null") return "N/A";

    switch (type) {
      case "currency":
        return `$${parseFloat(value).toLocaleString()}`;
      case "percentage":
        return `${value}%`;
      case "number":
        return parseFloat(value).toLocaleString();
      default:
        return value;
    }
  };

  const formatMarketCap = (value: string) => {
    if (!value || value === "None" || value === "null") return "N/A";
    const num = parseFloat(value);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const renderInfoItem = ({ item }: { item: InfoItem }) => (
    <View style={[styles.infoItem, { borderBottomColor: C.border }]}>
      <Text style={[styles.infoLabel, { color: C.textMuted }]}>
        {item.label}
      </Text>
      <Text style={[styles.infoValue, { color: C.textPrimary }]}>
        {item.type === "currency" && item.value !== "N/A"
          ? formatValue(item.value, "currency")
          : item.type === "percentage" && item.value !== "N/A"
          ? formatValue(item.value, "percentage")
          : item.type === "number" && item.value !== "N/A"
          ? formatValue(item.value, "number")
          : item.value}
      </Text>
    </View>
  );

  const renderSection = (title: string, data: InfoItem[]) => (
    <View style={[styles.section, { backgroundColor: C.surface }]}>
      <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
        {title}
      </Text>
      <FlatList
        data={data}
        renderItem={renderInfoItem}
        keyExtractor={(item) => item.label}
        scrollEnabled={false}
      />
    </View>
  );

  const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y"];

  const renderTimeframeButtons = () => (
    <View
      style={[
        styles.timeframeContainer,
        { backgroundColor: C.surface, borderColor: C.border },
      ]}
    >
      <Text style={[styles.chartTitle, { color: C.textPrimary }]}>
        Price Chart
      </Text>
      <View style={styles.timeframeButtons}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              {
                backgroundColor: C.inputBg,
                borderColor: C.border,
                borderWidth: 1,
              },
              selectedTimeframe === timeframe && { borderColor: C.accent },
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                { color: C.textPrimary },
                selectedTimeframe === timeframe && { color: C.accent },
              ]}
            >
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderChart = () => {
    if (chartLoading) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: C.surface }]}>
          <ActivityIndicator size="small" color={C.accent} />
          <Text style={[styles.chartLoadingText, { color: C.textSecondary }]}>
            Loading chart data...
          </Text>
        </View>
      );
    }

    if (chartError) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.chartErrorText, { color: C.textSecondary }]}>
            {chartError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: C.accent }]}
            onPress={fetchTimeSeriesData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (timeSeriesData.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.chartErrorText, { color: C.textSecondary }]}>
            No chart data available
          </Text>
        </View>
      );
    }

    // Prepare data for the chart - adjust based on timeframe
    const getChartDataPoints = () => {
      switch (selectedTimeframe) {
        case "1D":
          // For 1D, show all intraday data (5-minute intervals)
          return timeSeriesData;
        case "1W":
          // For 1W, show all available days (usually 4-7 days)
          return timeSeriesData;
        case "1M":
          // For 1M, show last 20 days or all if less
          return timeSeriesData.length > 20
            ? timeSeriesData.slice(-20)
            : timeSeriesData;
        case "3M":
          // For 3M, show last 30 days or all if less
          return timeSeriesData.length > 30
            ? timeSeriesData.slice(-30)
            : timeSeriesData;
        case "6M":
          // For 6M, show last 50 days or all if less
          return timeSeriesData.length > 50
            ? timeSeriesData.slice(-50)
            : timeSeriesData;
        case "1Y":
          // For 1Y, show last 80 days or all if less (better trend visibility)
          return timeSeriesData.length > 80
            ? timeSeriesData.slice(-80)
            : timeSeriesData;
        default:
          return timeSeriesData.slice(-10);
      }
    };

    const chartDataPoints = getChartDataPoints();

    // Validate data before rendering
    if (!chartDataPoints || chartDataPoints.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.chartErrorText, { color: C.textSecondary }]}>
            No chart data available for {selectedTimeframe}
          </Text>
        </View>
      );
    }

    // Ensure all data points have valid close prices
    const validDataPoints = chartDataPoints.filter(
      (item) => item && typeof item.close === "number" && !isNaN(item.close)
    );

    if (validDataPoints.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.chartErrorText, { color: C.textSecondary }]}>
            Invalid price data for {selectedTimeframe}
          </Text>
        </View>
      );
    }

    // Calculate price change for dynamic coloring
    const firstPrice = validDataPoints[0]?.close || 0;
    const lastPrice = validDataPoints[validDataPoints.length - 1]?.close || 0;
    const priceChange = lastPrice - firstPrice;
    const isPositive = priceChange >= 0;

    // Dynamic colors based on price movement
    const lineColor = isPositive ? "#00C851" : "#FF4444"; // Green for up, Red for down
    const fillColor = isPositive
      ? `rgba(0, 200, 81, 0.1)`
      : `rgba(255, 68, 68, 0.1)`;

    const chartData = {
      labels: validDataPoints.map((item, index) => {
        const date = new Date(item.time);

        // Smart spacing to prevent label overlap - adjust based on data amount
        const totalPoints = validDataPoints.length;
        let labelInterval;

        if (totalPoints <= 5) {
          labelInterval = 1; // Show all labels for small datasets
        } else if (totalPoints <= 20) {
          labelInterval = Math.max(1, Math.floor(totalPoints / 4)); // ~4 labels
        } else {
          labelInterval = Math.max(1, Math.floor(totalPoints / 5)); // ~5 labels for larger datasets
        }

        const shouldShowLabel =
          index % labelInterval === 0 || index === totalPoints - 1;

        if (!shouldShowLabel) return "";

        // Format labels based on timeframe for better readability
        if (selectedTimeframe === "1D") {
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else if (selectedTimeframe === "1W") {
          return date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          });
        } else if (selectedTimeframe === "6M" || selectedTimeframe === "1Y") {
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
        } else {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      }),
      datasets: [
        {
          data: validDataPoints.map((item) => item.close),
          color: (opacity = 1) =>
            `${lineColor}${Math.floor(opacity * 255)
              .toString(16)
              .padStart(2, "0")}`,
          strokeWidth: 3, // Slightly thicker line for better visibility
          withDots: selectedTimeframe === "1W", // Show dots only for weekly view
        },
      ],
    };

    // Calculate percentage change
    const percentChange =
      firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0;

    return (
      <View style={[styles.chartContainer, { backgroundColor: C.surface }]}>
        {/* Price Summary Header */}
        <View style={styles.priceHeader}>
          <Text style={[styles.currentPrice, { color: C.textPrimary }]}>
            ${lastPrice.toFixed(2)}
          </Text>
          <View style={styles.changeContainer}>
            <Text
              style={[
                styles.priceChange,
                { color: isPositive ? "#00C851" : "#FF4444" },
              ]}
            >
              {isPositive ? "+" : ""}${priceChange.toFixed(2)} (
              {isPositive ? "+" : ""}
              {percentChange.toFixed(2)}%)
            </Text>
            <View
              style={[
                styles.timeframeLabel,
                {
                  backgroundColor: isPositive
                    ? "rgba(0, 200, 81, 0.1)"
                    : "rgba(255, 68, 68, 0.1)",
                },
              ]}
            >
              <Text
                style={[
                  {
                    color: isPositive ? "#00C851" : "#FF4444",
                    fontSize: 12,
                    fontWeight: "600",
                  },
                ]}
              >
                {selectedTimeframe}
              </Text>
            </View>
          </View>
        </View>

        <LineChart
          data={chartData}
          width={width - 40}
          height={240}
          chartConfig={{
            backgroundColor: C.surface,
            backgroundGradientFrom: C.surface,
            backgroundGradientTo: C.surface,
            decimalPlaces: 2,
            color: () => lineColor,
            labelColor: () => C.textMuted,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: selectedTimeframe === "1W" ? "4" : "0", // Larger dots for weekly, hidden for others
              strokeWidth: "2",
              stroke: lineColor,
              fill: lineColor,
            },
            propsForBackgroundLines: {
              stroke: "transparent",
              strokeWidth: 0,
            },
            // Enhanced label styling
            propsForLabels: {
              fontSize: 11,
              fontWeight: "500",
            },
            // Better Y-axis formatting
            formatYLabel: (yValue: string) => {
              const value = parseFloat(yValue);
              if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
              }
              return `$${value.toFixed(0)}`;
            },
          }}
          bezier
          style={styles.chart}
          withHorizontalLines={false}
          withVerticalLines={false}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading company data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCompanyData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!companyData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Data</Text>
        <Text style={styles.errorText}>
          No company data available for {symbol}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const basicInfo: InfoItem[] = [
    { label: "Company Name", value: companyData.name, type: "text" },
    { label: "Sector", value: companyData.sector, type: "text" },
    { label: "Industry", value: companyData.industry, type: "text" },
    { label: "Exchange", value: companyData.exchange, type: "text" },
    { label: "Country", value: companyData.country, type: "text" },
    { label: "Currency", value: companyData.currency, type: "text" },
  ];

  const financialInfo: InfoItem[] = [
    { label: "Market Cap", value: companyData.marketCap, type: "currency" },
    { label: "P/E Ratio", value: companyData.peRatio, type: "number" },
    { label: "PEG Ratio", value: companyData.pegRatio, type: "number" },
    { label: "EPS", value: companyData.eps, type: "currency" },
    { label: "Revenue (TTM)", value: companyData.revenueTTM, type: "currency" },
    {
      label: "Profit Margin",
      value: companyData.profitMargin,
      type: "percentage",
    },
  ];

  const performanceInfo: InfoItem[] = [
    {
      label: "52 Week High",
      value: companyData["52WeekHigh"],
      type: "currency",
    },
    { label: "52 Week Low", value: companyData["52WeekLow"], type: "currency" },
    { label: "50 Day MA", value: companyData["50DayMA"], type: "currency" },
    { label: "200 Day MA", value: companyData["200DayMA"], type: "currency" },
    { label: "Beta", value: companyData.beta, type: "number" },
    {
      label: "Target Price",
      value: companyData.analystTargetPrice,
      type: "currency",
    },
  ];

  const growthInfo: InfoItem[] = [
    {
      label: "Quarterly Revenue Growth",
      value: companyData.quarterlyRevenueGrowth,
      type: "percentage",
    },
    {
      label: "Quarterly Earnings Growth",
      value: companyData.quarterlyEarningsGrowth,
      type: "percentage",
    },
  ];

  const dividendInfo: InfoItem[] = [
    {
      label: "Dividend Per Share",
      value: companyData.dividend.perShare,
      type: "currency",
    },
    {
      label: "Dividend Yield",
      value: companyData.dividend.yield,
      type: "percentage",
    },
    {
      label: "Ex-Dividend Date",
      value: companyData.dividend.exDate,
      type: "text",
    },
    {
      label: "Next Dividend Date",
      value: companyData.dividend.nextDate,
      type: "text",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: C.surface, borderBottomColor: C.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: C.accent }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.symbol, { color: C.textPrimary }]}>
          {companyData.symbol}
        </Text>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmarkPress}
        >
          <Feather name="bookmark" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: C.background }}
      >
        {renderTimeframeButtons()}
        {renderChart()}

        {companyData.description && (
          <View
            style={[styles.descriptionSection, { backgroundColor: C.surface }]}
          >
            <Text style={[styles.descriptionTitle, { color: C.textPrimary }]}>
              About
            </Text>
            <Text style={[styles.description, { color: C.textSecondary }]}>
              {companyData.description}
            </Text>
          </View>
        )}

        {companyData.website && (
          <View style={[styles.websiteSection, { backgroundColor: C.surface }]}>
            <Text style={[styles.websiteTitle, { color: C.textPrimary }]}>
              Website
            </Text>
            <Text style={[styles.website, { color: C.accent }]}>
              {companyData.website}
            </Text>
          </View>
        )}

        {renderSection("Basic Information", basicInfo)}
        {renderSection("Financial Metrics", financialInfo)}
        {renderSection("Performance", performanceInfo)}
        {renderSection("Growth", growthInfo)}
        {renderSection("Dividend Information", dividendInfo)}

        <View style={[styles.analystSection, { backgroundColor: C.surface }]}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
            Analyst Ratings
          </Text>
          <View style={styles.ratingsContainer}>
            <View
              style={[
                styles.ratingItem,
                {
                  backgroundColor: C.card,
                  borderColor: C.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.ratingLabel, { color: C.textPrimary }]}>
                Strong Buy
              </Text>
              <Text style={[styles.ratingValue, { color: C.textPrimary }]}>
                {companyData.analystRatings.strongBuy || "N/A"}
              </Text>
            </View>
            <View
              style={[
                styles.ratingItem,
                {
                  backgroundColor: C.card,
                  borderColor: C.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.ratingLabel, { color: C.textPrimary }]}>
                Buy
              </Text>
              <Text style={[styles.ratingValue, { color: C.textPrimary }]}>
                {companyData.analystRatings.buy || "N/A"}
              </Text>
            </View>
            <View
              style={[
                styles.ratingItem,
                {
                  backgroundColor: C.card,
                  borderColor: C.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.ratingLabel, { color: C.textPrimary }]}>
                Hold
              </Text>
              <Text style={[styles.ratingValue, { color: C.textPrimary }]}>
                {companyData.analystRatings.hold || "N/A"}
              </Text>
            </View>
            <View
              style={[
                styles.ratingItem,
                {
                  backgroundColor: C.card,
                  borderColor: C.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.ratingLabel, { color: C.textPrimary }]}>
                Sell
              </Text>
              <Text style={[styles.ratingValue, { color: C.textPrimary }]}>
                {companyData.analystRatings.sell || "N/A"}
              </Text>
            </View>
            <View
              style={[
                styles.ratingItem,
                {
                  backgroundColor: C.card,
                  borderColor: C.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.ratingLabel, { color: C.textPrimary }]}>
                Strong Sell
              </Text>
              <Text style={[styles.ratingValue, { color: C.textPrimary }]}>
                {companyData.analystRatings.strongSell || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Watchlist Modal */}
        <Modal
          visible={showWatchlistModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWatchlistModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
                Add to Watchlist
              </Text>

              {/* Create new watchlist */}
              <View style={styles.createWatchlistContainer}>
                <TextInput
                  style={[
                    styles.watchlistInput,
                    {
                      backgroundColor: C.inputBg,
                      borderColor: C.border,
                      color: C.textPrimary,
                    },
                  ]}
                  placeholder="Create new watchlist..."
                  value={newWatchlistName}
                  onChangeText={setNewWatchlistName}
                  placeholderTextColor={C.textMuted}
                />
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: C.accent }]}
                  onPress={handleCreateWatchlist}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Existing watchlists */}
              <Text
                style={[styles.watchlistSectionTitle, { color: C.textPrimary }]}
              >
                Existing Watchlists
              </Text>
              <FlatList
                data={watchlists}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.watchlistItem,
                      { borderBottomColor: C.border },
                      selectedWatchlistId === item.id && {
                        backgroundColor: C.inputBg,
                      },
                    ]}
                    onPress={() => setSelectedWatchlistId(item.id)}
                  >
                    <Text
                      style={[
                        styles.watchlistItemText,
                        { color: C.textPrimary },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedWatchlistId === item.id && (
                      <Text style={[styles.checkmark, { color: C.accent }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                style={styles.watchlistList}
              />

              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: C.inputBg }]}
                  onPress={() => setShowWatchlistModal(false)}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: C.textPrimary }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: selectedWatchlistId ? C.accent : "#000",
                    },
                  ]}
                  onPress={() =>
                    selectedWatchlistId &&
                    handleAddToWatchlist(selectedWatchlistId)
                  }
                  disabled={!selectedWatchlistId}
                >
                  <Text style={styles.confirmButtonText}>Add to Watchlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    paddingTop: 30,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  symbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  descriptionSection: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  websiteSection: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
  },
  websiteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  website: {
    fontSize: 14,
    color: "#007AFF",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  analystSection: {
    backgroundColor: "#fff",
    marginBottom: 20,
    padding: 15,
  },
  ratingsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  ratingItem: {
    width: (width - 60) / 2,
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  timeframeContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  timeframeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    minWidth: 40,
    alignItems: "center",
  },
  timeframeButtonActive: {
    backgroundColor: "#007AFF",
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  timeframeButtonTextActive: {
    color: "#fff",
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  priceHeader: {
    marginBottom: 12,
    paddingHorizontal: 8,
    alignItems: "center", // Center align the entire header
  },
  priceInfo: {
    alignItems: "center", // Center align price info
    width: "100%",
  },
  currentPrice: {
    fontSize: 22, // Reduced from 28
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the change info
    gap: 10,
  },
  priceChange: {
    fontSize: 14, // Reduced from 16
    fontWeight: "600",
  },
  timeframeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  chartLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  chartErrorText: {
    fontSize: 14,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 10,
  },
  bookmarkButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  createWatchlistContainer: {
    flexDirection: "row",
    marginBottom: 25,
    alignItems: "center",
    gap: 12,
  },
  watchlistInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  watchlistSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginTop: 5,
  },
  watchlistList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  watchlistItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedWatchlistItem: {
    backgroundColor: "#e3f2fd",
  },
  watchlistItemText: {
    fontSize: 16,
    color: "#333",
  },
  checkmark: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "bold",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default DetailScreen;
