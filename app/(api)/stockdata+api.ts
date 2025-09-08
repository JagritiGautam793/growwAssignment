const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";
const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;

// Demo fallback data
const DEMO_GAINERS = [
  { ticker: "AAPL", price: "150.25", change_amount: "+5.75", change_percentage: "+3.98%", volume: "45123000" },
  { ticker: "MSFT", price: "305.89", change_amount: "+12.34", change_percentage: "+4.20%", volume: "28456000" },
  { ticker: "GOOGL", price: "2750.50", change_amount: "+85.25", change_percentage: "+3.20%", volume: "15789000" },
  { ticker: "AMZN", price: "3200.75", change_amount: "+95.50", change_percentage: "+3.08%", volume: "22456000" },
  { ticker: "TSLA", price: "245.80", change_amount: "+7.30", change_percentage: "+3.06%", volume: "35678000" },
  { ticker: "NVDA", price: "425.60", change_amount: "+12.45", change_percentage: "+3.01%", volume: "18234000" },
  { ticker: "META", price: "325.45", change_amount: "+9.25", change_percentage: "+2.93%", volume: "25789000" },
  { ticker: "NFLX", price: "445.20", change_amount: "+12.80", change_percentage: "+2.96%", volume: "12456000" },
];

const DEMO_LOSERS = [
  { ticker: "SNAP", price: "8.45", change_amount: "-0.35", change_percentage: "-3.98%", volume: "45123000" },
  { ticker: "UBER", price: "42.15", change_amount: "-1.75", change_percentage: "-3.99%", volume: "28456000" },
  { ticker: "LYFT", price: "12.30", change_amount: "-0.45", change_percentage: "-3.53%", volume: "15789000" },
  { ticker: "COIN", price: "65.25", change_amount: "-2.15", change_percentage: "-3.19%", volume: "22456000" },
  { ticker: "ROKU", price: "55.80", change_amount: "-1.70", change_percentage: "-2.95%", volume: "35678000" },
  { ticker: "PINS", price: "25.60", change_amount: "-0.75", change_percentage: "-2.85%", volume: "18234000" },
  { ticker: "TWTR", price: "38.45", change_amount: "-1.05", change_percentage: "-2.66%", volume: "25789000" },
  { ticker: "SQ", price: "75.20", change_amount: "-1.95", change_percentage: "-2.53%", volume: "12456000" },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'gainer' or 'loser'
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let data;
    let topGainers;
    let topLosers;

    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      data = await response.json();
      
      if (!data.top_gainers || !data.top_losers) {
        throw new Error("Invalid API response format");
      }

      topGainers = data.top_gainers;
      topLosers = data.top_losers;
      
    } catch (apiError) {
      console.warn("API failed, using demo data:", apiError);
      // Use demo data as fallback
      topGainers = DEMO_GAINERS;
      topLosers = DEMO_LOSERS;
    }

    const mapStockData = (item: any) => ({
      ticker: item.ticker,
      price: item.price,
      change_amount: item.change_amount,
      change_percentage: item.change_percentage,
      volume: item.volume,
    });

    if (type && (type === 'gainer' || type === 'loser')) {
      const sourceData = type === 'gainer' ? topGainers : topLosers;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = sourceData.slice(startIndex, endIndex);

      const result = {
        [type === 'gainer' ? 'gainers' : 'losers']: paginatedData.map(mapStockData),
        pagination: {
          page,
          limit,
          total: sourceData.length,
          hasMore: endIndex < sourceData.length,
        },
      };

      return Response.json(result);
    }

    const result = {
      gainers: topGainers.map(mapStockData),
      losers: topLosers.map(mapStockData),
    };

    return Response.json(result);
  } catch (error) {
    console.error("Error in GET handler:", error);
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Failed to parse API response" },
        { status: 500 }
      );
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}