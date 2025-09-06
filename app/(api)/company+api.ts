const BASE_URL = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo"; // fallback to demo key

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return Response.json(
        { error: "Missing required query param: symbol" },
        { status: 400 }
      );
    }

    const apiUrl = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AlphaVantage API error:", errorText);
      return Response.json(
        { error: `API request failed with status ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    const cleaned = {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      sector: data.Sector,
      industry: data.Industry,
      exchange: data.Exchange,
      country: data.Country,
      currency: data.Currency,
      website: data.OfficialSite,

      marketCap: data.MarketCapitalization,
      peRatio: data.PERatio,
      pegRatio: data.PEGRatio,
      eps: data.EPS,
      dividend: {
        perShare: data.DividendPerShare,
        yield: data.DividendYield,
        exDate: data.ExDividendDate,
        nextDate: data.DividendDate,
      },

      revenueTTM: data.RevenueTTM,
      profitMargin: data.ProfitMargin,
      quarterlyRevenueGrowth: data.QuarterlyRevenueGrowthYOY,
      quarterlyEarningsGrowth: data.QuarterlyEarningsGrowthYOY,

      beta: data.Beta,
      "52WeekHigh": data["52WeekHigh"],
      "52WeekLow": data["52WeekLow"],
      "50DayMA": data["50DayMovingAverage"],
      "200DayMA": data["200DayMovingAverage"],

      
      analystTargetPrice: data.AnalystTargetPrice,
      analystRatings: {
        strongBuy: data.AnalystRatingStrongBuy,
        buy: data.AnalystRatingBuy,
        hold: data.AnalystRatingHold,
        sell: data.AnalystRatingSell,
        strongSell: data.AnalystRatingStrongSell,
      },
    };

    return new Response(JSON.stringify(cleaned), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in company+api:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}