const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'gainer' or 'loser'
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const response = await fetch(API_URL);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API request failed:", errorText);
      return Response.json(
        { error: `API request failed with status ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    const topGainers = data.top_gainers || [];
    const topLosers = data.top_losers || [];

    const mapStockData = (item: any) => ({
      ticker: item.ticker,
      price: item.price,
      change_amount: item.change_amount,
      change_percentage: item.change_percentage,
      volume: item.volume,
    });

    // If specific type is requested with pagination
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

    // Default response with all data (for home screen)
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