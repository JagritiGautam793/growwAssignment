const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";
const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'gainer' or 'loser'
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      return Response.json(
        { error: `API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.top_gainers || !data.top_losers) {
      return Response.json(
        { error: "Invalid API response format" },
        { status: 502 }
      );
    }

    const topGainers = data.top_gainers;
    const topLosers = data.top_losers;

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