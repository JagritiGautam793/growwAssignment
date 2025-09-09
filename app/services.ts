const API_KEY = "OSUD8GPO5C6O6G5L"
const BASE_URL = "https://www.alphavantage.co/query";

export interface StockData {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
}

export interface TimeSeriesData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyData {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  exchange: string;
  country: string;
  currency: string;
  website: string;
  marketCap: string;
  peRatio: string;
  pegRatio: string;
  eps: string;
  dividend: {
    perShare: string;
    yield: string;
    exDate: string;
    nextDate: string;
  };
  revenueTTM: string;
  profitMargin: string;
  quarterlyRevenueGrowth: string;
  quarterlyEarningsGrowth: string;
  beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMA": string;
  "200DayMA": string;
  analystTargetPrice: string;
  analystRatings: {
    strongBuy: string;
    buy: string;
    hold: string;
    sell: string;
    strongSell: string;
  };
}

export const stockDataService = {
  async getStockData(options?: {
    type?: "gainer" | "loser";
    page?: number;
    limit?: number;
  }) {
    try {
      const API_URL = `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.top_gainers || !data.top_losers) {
        throw new Error("Invalid API response format");
      }

      const topGainers = data.top_gainers;
      const topLosers = data.top_losers;

      const mapStockData = (item: any): StockData => ({
        ticker: item.ticker,
        price: item.price,
        change_amount: item.change_amount,
        change_percentage: item.change_percentage,
        volume: item.volume,
      });

      if (options?.type && (options.type === 'gainer' || options.type === 'loser')) {
        const sourceData = options.type === 'gainer' ? topGainers : topLosers;
        const page = options.page || 1;
        const limit = options.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = sourceData.slice(startIndex, endIndex);

        const result = {
          [options.type === 'gainer' ? 'gainers' : 'losers']: paginatedData.map(mapStockData),
          pagination: {
            page,
            limit,
            total: sourceData.length,
            hasMore: endIndex < sourceData.length,
          },
        };

        return result;
      }

      const result = {
        gainers: topGainers.map(mapStockData),
        losers: topLosers.map(mapStockData),
      };

      return result;
    } catch (error) {
      console.error("Error in stockDataService:", error);
      if (error instanceof SyntaxError) {
        throw new Error("Failed to parse API response");
      }
      throw error;
    }
  }
};

export const searchService = {
  async searchSymbols(keywords: string): Promise<{ results: SearchResult[] }> {
    try {
      if (!keywords) {
        throw new Error("Missing required parameter: keywords");
      }

      const apiUrl = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
        keywords
      )}&datatype=json&apikey=${API_KEY}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.bestMatches) {
        throw new Error("Invalid API response format");
      }

      const results = data.bestMatches.map((item: any): SearchResult => ({
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

      return { results };
    } catch (error: any) {
      console.error("Error in searchService:", error);
      throw new Error("Failed to fetch search results");
    }
  }
};

export const timeSeriesService = {
  async getTimeSeries(symbol: string, timeframe: string = "1D"): Promise<{
    symbol: string;
    timeframe: string;
    data: TimeSeriesData[];
  }> {
    try {
      if (!symbol) {
        throw new Error("Missing required parameter: symbol");
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
          throw new Error("Invalid timeframe. Use 1D, 1W, 1M, 3M, 6M, 1Y");
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      if (!data[key]) {
        throw new Error("Invalid API response format");
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

      let filtered: TimeSeriesData[];
      
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

      return { symbol, timeframe, data: filtered };
    } catch (error: any) {
      console.error("Error in timeSeriesService:", error);
      throw new Error("Failed to fetch time series data");
    }
  }
};

export const companyService = {
  async getCompanyData(symbol: string): Promise<CompanyData> {
    try {
      if (!symbol) {
        throw new Error("Missing required parameter: symbol");
      }

      const apiUrl = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AlphaVantage API error:", errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      const cleaned: CompanyData = {
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

      return cleaned;
    } catch (error) {
      console.error("Error in companyService:", error);
      throw new Error("Failed to fetch company data");
    }
  }
};

export const healthService = {
  getStatus() {
    return { status: "UP" };
  }
};