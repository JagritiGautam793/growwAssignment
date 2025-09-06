import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

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

const { width } = Dimensions.get("window");

const DetailScreen = () => {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1D");
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

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
      setTimeSeriesData(data.data);
    } catch (err) {
      console.error("Error fetching time series data:", err);
      setChartError(
        err instanceof Error ? err.message : "Failed to fetch time series data"
      );
    } finally {
      setChartLoading(false);
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
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{item.label}</Text>
      <Text style={styles.infoValue}>
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
    <View style={styles.timeframeContainer}>
      <Text style={styles.chartTitle}>Price Chart</Text>
      <View style={styles.timeframeButtons}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.timeframeButtonActive,
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                selectedTimeframe === timeframe &&
                  styles.timeframeButtonTextActive,
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
        <View style={styles.chartContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.chartLoadingText}>Loading chart data...</Text>
        </View>
      );
    }

    if (chartError) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartErrorText}>{chartError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchTimeSeriesData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (timeSeriesData.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartErrorText}>No chart data available</Text>
        </View>
      );
    }

    // Prepare data for the chart
    const chartData = {
      labels: timeSeriesData
        .slice(-10) // Show last 10 data points for better readability
        .map((item) => {
          const date = new Date(item.time);
          return selectedTimeframe === "1D"
            ? date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
        }),
      datasets: [
        {
          data: timeSeriesData.slice(-10).map((item) => item.close),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 30}
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#007AFF",
            },
          }}
          bezier
          style={styles.chart}
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.symbol}>{companyData.symbol}</Text>
      </View>

      {renderTimeframeButtons()}
      {renderChart()}

      {companyData.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>About</Text>
          <Text style={styles.description}>{companyData.description}</Text>
        </View>
      )}

      {companyData.website && (
        <View style={styles.websiteSection}>
          <Text style={styles.websiteTitle}>Website</Text>
          <Text style={styles.website}>{companyData.website}</Text>
        </View>
      )}

      {renderSection("Basic Information", basicInfo)}
      {renderSection("Financial Metrics", financialInfo)}
      {renderSection("Performance", performanceInfo)}
      {renderSection("Growth", growthInfo)}
      {renderSection("Dividend Information", dividendInfo)}

      <View style={styles.analystSection}>
        <Text style={styles.sectionTitle}>Analyst Ratings</Text>
        <View style={styles.ratingsContainer}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Strong Buy</Text>
            <Text style={[styles.ratingValue, { color: "#4CAF50" }]}>
              {companyData.analystRatings.strongBuy || "N/A"}
            </Text>
          </View>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Buy</Text>
            <Text style={[styles.ratingValue, { color: "#8BC34A" }]}>
              {companyData.analystRatings.buy || "N/A"}
            </Text>
          </View>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Hold</Text>
            <Text style={[styles.ratingValue, { color: "#FF9800" }]}>
              {companyData.analystRatings.hold || "N/A"}
            </Text>
          </View>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Sell</Text>
            <Text style={[styles.ratingValue, { color: "#FF5722" }]}>
              {companyData.analystRatings.sell || "N/A"}
            </Text>
          </View>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Strong Sell</Text>
            <Text style={[styles.ratingValue, { color: "#F44336" }]}>
              {companyData.analystRatings.strongSell || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    padding: 15,
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
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
});

export default DetailScreen;
