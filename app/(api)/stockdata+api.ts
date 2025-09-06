const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

export async function GET(request: Request) {
  try {
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

    const result = {
      gainers: topGainers.map((item: any) => ({
        ticker: item.ticker,
        price: item.price,
        change_amount: item.change_amount,
        change_percentage: item.change_percentage,
        volume: item.volume,
      })),
      losers: topLosers.map((item: any) => ({
        ticker: item.ticker,
        price: item.price,
        change_amount: item.change_amount,
        change_percentage: item.change_percentage,
        volume: item.volume,
      })),
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