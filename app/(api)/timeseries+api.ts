import "dotenv/config";

const BASE_URL = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const timeframe = searchParams.get("timeframe") || "1D";

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Missing required query param: symbol" }),
        { status: 400 }
      );
    }

    let apiUrl = "";
    let key = "";

    switch (timeframe) {
      case "1D":
        apiUrl = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&outputsize=compact&apikey=${API_KEY}`;
        key = "Time Series (5min)";
        break;
      case "1W":
      case "1M":
      case "3M":
      case "6M":
      case "1Y":
        apiUrl = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`;
        key = "Time Series (Daily)";
        break;
      default:
        return new Response(
          JSON.stringify({
            error: "Invalid timeframe. Use 1D, 1W, 1M, 3M, 6M, 1Y",
          }),
          { status: 400 }
        );
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    // Check if data is available
    // console.log(`Fetching ${timeframe} data for ${symbol}:`, { hasData: !!data[key] });

    if (!data[key]) {
      return new Response(
        JSON.stringify({ error: "Invalid API response", data }),
        { status: 500 }
      );
    }

    const series = Object.entries<any>(data[key]).map(([time, values]) => ({
      time,
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: parseInt(values["5. volume"], 10),
    }));

    const sorted = series.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const now = new Date();
    let cutoff: Date = new Date();

    switch (timeframe) {
      case "1D":
        // For 1D, show the most recent trading day's data - use special logic
        // This will be handled after sorting to get the most recent date
        cutoff = new Date(0); // Temporary - will be overridden below
        break;
      case "1W":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "1M":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    let filtered: any[];
    
    if (timeframe === "1D") {
      // For 1D, get the most recent trading day's data
      // Find the most recent date in the data and show all entries from that date
      if (sorted.length > 0) {
        const mostRecentEntry = sorted[sorted.length - 1];
        const mostRecentDate = mostRecentEntry.time.split(' ')[0]; // Get date part (YYYY-MM-DD)
        
        filtered = sorted.filter(item => item.time.startsWith(mostRecentDate));
      } else {
        filtered = [];
      }
    } else {
      // For other timeframes, use the cutoff date
      filtered = sorted.filter(
        (item) => new Date(item.time) >= cutoff
      );
    }

    // Log filtering results (uncomment for debugging)
    // console.log(`Filtering ${timeframe} data:`, {
    //   totalEntries: sorted.length,
    //   filteredEntries: filtered.length,
    //   cutoffDate: timeframe === "1D" ? "most recent trading day" : cutoff.toISOString()
    // });

    return new Response(
      JSON.stringify({ symbol, timeframe, data: filtered }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in /timeseries route:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch time series data" }),
      { status: 500 }
    );
  }
}