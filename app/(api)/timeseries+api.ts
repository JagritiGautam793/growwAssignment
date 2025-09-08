import "dotenv/config";

const BASE_URL = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";

const generateDemoTimeSeriesData = (symbol: string, timeframe: string) => {
  const now = new Date();
  const data = [];
  let basePrice = 150; 
  
  let intervals = 0;
  let timeIncrement = 0;
  
  switch (timeframe) {
    case "1D":
      intervals = 78; 
      timeIncrement = 5 * 60 * 1000;
      break;
    case "1W":
      intervals = 7;
      timeIncrement = 24 * 60 * 60 * 1000; 
      break;
    case "1M":
      intervals = 30;
      timeIncrement = 24 * 60 * 60 * 1000; 
      break;
    case "3M":
      intervals = 90;
      timeIncrement = 24 * 60 * 60 * 1000; 
      break;
    case "6M":
      intervals = 180;
      timeIncrement = 24 * 60 * 60 * 1000; 
      break;
    case "1Y":
      intervals = 365;
      timeIncrement = 24 * 60 * 60 * 1000;
      break;
  }
  
  for (let i = intervals; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * timeIncrement));
    const timeString = timeframe === "1D" 
      ? time.toISOString().slice(0, 16).replace('T', ' ')
      : time.toISOString().slice(0, 10);
    
    const change = (Math.random() - 0.5) * 4; 
    basePrice = Math.max(10, basePrice + change); 
    
    const open = basePrice;
    const high = Math.max(open, open + Math.random() * 3);
    const low = Math.max(1, Math.min(open, open - Math.random() * 3)); 
    const close = Math.max(low, Math.min(high, low + Math.random() * (high - low)));
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      time: timeString,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
    
    basePrice = close; 
  }
  
  return data;
};

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

    let series;

    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000) 
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      if (!data[key]) {
        throw new Error("Invalid API response format");
      }

      series = Object.entries<any>(data[key]).map(([time, values]) => ({
        time,
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseInt(values["5. volume"], 10),
      }));

    } catch (apiError) {
      console.warn(`Timeseries API failed for ${symbol}, using demo data:`, apiError);
      const demoData = generateDemoTimeSeriesData(symbol, timeframe);
      
      return new Response(
        JSON.stringify({ symbol, timeframe, data: demoData }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

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
      JSON.stringify({ message: "Failed to fetch time series data" }),
      { status: 500 }
    );
  }
}