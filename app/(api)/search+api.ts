const BASE_URL = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get("keywords");

    if (!keywords) {
      return new Response(
        JSON.stringify({ error: "Missing required query param: keywords" }),
        { status: 400 }
      );
    }

    const apiUrl = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
      keywords
    )}&datatype=json&apikey=${API_KEY}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.bestMatches) {
      return new Response(
        JSON.stringify({ error: "Invalid API response", data }),
        { status: 500 }
      );
    }

    const results = data.bestMatches.map((item: any) => ({
      symbol: item["1. symbol"],
      name: item["2. name"],
      type: item["3. type"],
      region: item["4. region"],
      marketOpen: item["5. marketOpen"],
      marketClose: item["6. marketClose"],
      timezone: item["7. timezone"],
      currency: item["8. currency"],
      matchScore: parseFloat(item["9. matchScore"]),
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in /search route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch search results" }),
      { status: 500 }
    );
  }
}