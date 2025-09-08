import "dotenv/config";

const BASE_URL = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";

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

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) 
    });
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `API request failed with status ${response.status}` }),
        { status: response.status }
      );
    }
    
    const data = await response.json();

    if (!data[key]) {
      return new Response(
        JSON.stringify({ error: "Invalid API response format" }),
        { status: 502 }
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
        cutoff = new Date(0); 
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
  
      if (sorted.length > 0) {
        const mostRecentEntry = sorted[sorted.length - 1];
        const mostRecentDate = mostRecentEntry.time.split(' ')[0]; 
        
        filtered = sorted.filter(item => item.time.startsWith(mostRecentDate));
      } else {
        filtered = [];
      }
    } else {
      filtered = sorted.filter(
        (item) => new Date(item.time) >= cutoff
      );
    }

   
    return new Response(
      JSON.stringify({ symbol, timeframe, data: filtered }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in /timeseries route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch time series data" }),
      { status: 500 }
    );
  }
}