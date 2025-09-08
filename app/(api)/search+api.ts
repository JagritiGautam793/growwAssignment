const BASE_URL = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";

// Demo fallback search results
const DEMO_SEARCH_RESULTS = [
  {
    "1. symbol": "AAPL",
    "2. name": "Apple Inc.",
    "3. type": "Equity",
    "4. region": "United States",
    "5. marketOpen": "09:30",
    "6. marketClose": "16:00",
    "7. timezone": "UTC-04",
    "8. currency": "USD",
    "9. matchScore": "1.0000"
  },
  {
    "1. symbol": "MSFT",
    "2. name": "Microsoft Corporation",
    "3. type": "Equity",
    "4. region": "United States",
    "5. marketOpen": "09:30",
    "6. marketClose": "16:00",
    "7. timezone": "UTC-04",
    "8. currency": "USD",
    "9. matchScore": "0.9500"
  },
  {
    "1. symbol": "GOOGL",
    "2. name": "Alphabet Inc. Class A",
    "3. type": "Equity",
    "4. region": "United States",
    "5. marketOpen": "09:30",
    "6. marketClose": "16:00",
    "7. timezone": "UTC-04",
    "8. currency": "USD",
    "9. matchScore": "0.9000"
  },
  {
    "1. symbol": "AMZN",
    "2. name": "Amazon.com Inc.",
    "3. type": "Equity",
    "4. region": "United States",
    "5. marketOpen": "09:30",
    "6. marketClose": "16:00",
    "7. timezone": "UTC-04",
    "8. currency": "USD",
    "9. matchScore": "0.8500"
  },
  {
    "1. symbol": "TSLA",
    "2. name": "Tesla Inc.",
    "3. type": "Equity",
    "4. region": "United States",
    "5. marketOpen": "09:30",
    "6. marketClose": "16:00",
    "7. timezone": "UTC-04",
    "8. currency": "USD",
    "9. matchScore": "0.8000"
  }
];

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

    let results;

    try {
      const apiUrl = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
        keywords
      )}&datatype=json&apikey=${API_KEY}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) 
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.bestMatches) {
        throw new Error("Invalid API response format");
      }

      results = data.bestMatches.map((item: any) => ({
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

    } catch (apiError) {
      console.warn("Search API failed, using demo data:", apiError);
      
      const filteredDemo = DEMO_SEARCH_RESULTS.filter(item => 
        item["1. symbol"].toLowerCase().includes(keywords.toLowerCase()) ||
        item["2. name"].toLowerCase().includes(keywords.toLowerCase())
      );

      const demoToUse = filteredDemo.length > 0 ? filteredDemo : DEMO_SEARCH_RESULTS;

      results = demoToUse.map((item: any) => ({
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
    }

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