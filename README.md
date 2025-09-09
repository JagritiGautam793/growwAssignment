# Stock Trading App - Groww Assignment 

## 📱 Google Drive Link

**[🔗 Download APK & View Demo - Google Drive](https://drive.google.com/drive/folders/1W84U7bnJXRuQXl-Fa9afANKCVWX2-IQO?usp=sharing)**

_Contains: APK file, screenshots, and demo video_

A React Native application for viewing stock market data using Alpha Vantage API.

## What's Implemented

### Screens

- **Home Screen**: Displays top gainers/losers and search functionality
- **Detail Screen**: Shows stock price charts and company information
- **Watchlist Screen**: Manages saved stocks
- **Stock List Screen**: Shows filtered stock lists

### Features

- Stock search with debounced input
- Price charts with multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y)
- Add/remove stocks from watchlist
- Light/dark theme toggle
- SQLite database for local storage

### Technology Stack

- React Native with Expo SDK 53
- Expo Router for navigation
- TypeScript
- SQLite with Drizzle ORM
- react-native-chart-kit for charts
- Alpha Vantage API for market data

---

## Backend Workflow

### API Architecture

The application implements a Backend-for-Frontend (BFF) pattern using Expo's API route handlers instead of making direct API calls from the frontend.

### Why Use Expo API Route Handlers?

**API Key Security**

- Problem: Exposing API keys in frontend code makes them visible to anyone
- Solution: API keys are stored as environment variables on the server
- Implementation: All Alpha Vantage API calls are made server-side

**Data Transformation**

- Response Normalization: Raw API responses are cleaned and transformed
- Field Mapping: Complex API response structures are simplified for frontend consumption
- Data Filtering: Only necessary data is sent to the client

### API Endpoints

#### 1. Company Overview API

**Endpoint**: `GET /company`

**Purpose**: Retrieves company information and financial metrics for a stock symbol.

**Parameters**:

- `symbol` (required): Stock ticker symbol

**Response Structure**:

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc",
  "description": "Company description...",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "marketCap": "3000000000000",
  "peRatio": "28.5",
  "eps": "6.05",
  "52WeekHigh": "199.62",
  "52WeekLow": "164.08"
}
```

#### 2. Stock Search API

**Endpoint**: `GET /search`

**Purpose**: Searches for stocks based on keywords.

**Parameters**:

- `keywords` (required): Search term

**Response Structure**:

```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc",
      "type": "Equity",
      "region": "United States",
      "matchScore": 0.8571
    }
  ]
}
```

#### 3. Stock Data API

**Endpoint**: `GET /stockdata`

**Purpose**: Retrieves top gaining and losing stocks.

**Parameters**:

- `type` (optional): Filter by "gainer" or "loser"
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page

**Response Structure**:

```json
{
  "gainers": [
    {
      "ticker": "NVDA",
      "price": "875.42",
      "change_amount": "+45.23",
      "change_percentage": "+5.45%",
      "volume": "15234567"
    }
  ],
  "losers": [...]
}
```

#### 4. Time Series Data API

**Endpoint**: `GET /timeseries`

**Purpose**: Retrieves historical price data for different timeframes.

**Parameters**:

- `symbol` (required): Stock ticker symbol
- `timeframe` (optional): "1D", "1W", "1M", "3M", "6M", "1Y"

**Timeframe Logic**:
| Timeframe | Data Source | Interval | Filtering Logic |
|-----------|-------------|----------|-----------------|
| 1D | TIME_SERIES_INTRADAY | 5-minute | Most recent trading day only |
| 1W | TIME_SERIES_DAILY | Daily | Last 7 days |
| 1M | TIME_SERIES_DAILY | Daily | Last 30 days |
| 3M | TIME_SERIES_DAILY | Daily | Last 90 days |
| 6M | TIME_SERIES_DAILY | Daily | Last 180 days |
| 1Y | TIME_SERIES_DAILY | Daily | Last 365 days |

**Response Structure**:

```json
{
  "symbol": "AAPL",
  "timeframe": "1D",
  "data": [
    {
      "time": "2024-01-15 09:30:00",
      "open": 185.25,
      "high": 186.4,
      "low": 184.9,
      "close": 185.8,
      "volume": 1234567
    }
  ]
}
```

---

## Frontend Workflow

### Application Architecture

Component-based architecture with context-driven state management using Expo Router for file-based routing.

### Navigation Structure

```
Tab Navigator
├── Home (index.tsx → homescreen.tsx)
└── Watchlist (explore.tsx → watchlistscreen.tsx)

Modal Screens
├── detailscreen.tsx
└── stocklistscreen.tsx
```

### State Management

**Theme Context** (`contexts/ThemeContext.tsx`)

- Manages light/dark theme state
- Provides `getColors()` function for theme-aware styling
- Persists theme preference

**Watchlist Context** (`contexts/WatchlistContext.tsx`)

- Manages watchlist state and operations
- Provides CRUD operations for watchlists
- Interfaces with SQLite database via Drizzle ORM

### Screen Workflows

#### Home Screen (`screens/homescreen.tsx`)

1. Fetches top gainers/losers from `/stockdata` endpoint
2. Implements debounced search (300ms delay) using `/search` endpoint
3. Displays color-coded stock cards (green for gainers, red for losers)
4. Navigates to detail screen or stock list screen on selection

#### Detail Screen (`screens/detailscreen.tsx`)

1. Receives stock symbol via navigation params
2. Fetches company data from `/company` endpoint
3. Fetches time series data from `/timeseries` endpoint
4. Renders price chart using `react-native-chart-kit`
5. Implements timeframe switching (1D, 1W, 1M, 3M, 6M, 1Y)
6. Provides watchlist add/remove functionality
7. Handles chart data optimization based on selected timeframe

#### Watchlist Screen (`screens/watchlistscreen.tsx`)

1. Loads watchlists from SQLite database
2. Displays saved stocks with current prices
3. Provides delete functionality for watchlist items
4. Navigates to detail screen when stock is selected

### Data Flow

```
User Interaction → React Component → Context/Hook → API Route Handler → Alpha Vantage API → Response Processing → State Update → UI Re-render
```

### Chart Implementation

- Uses `react-native-chart-kit` for line charts
- Implements dynamic label spacing to prevent overcrowding
- Color-codes chart lines based on price movement (green/red)
- Filters data points based on timeframe for optimal performance
- Handles different date/time formatting per timeframe

### Database Operations

- Uses SQLite with Drizzle ORM for local data persistence
- Stores watchlist data with company information
- Implements CRUD operations through `service/watchlist.ts`

---

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
# Create .env file
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

3. Start the app:

```bash
npm start
```

4. Run on device:

```bash
# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
app/
├── (api)/              # API route handlers
│   ├── company+api.ts  # Company overview endpoint
│   ├── search+api.ts   # Stock search endpoint
│   ├── stockdata+api.ts # Top gainers/losers endpoint
│   ├── timeseries+api.ts # Historical data endpoint
│   └── health+api.ts   # Health check endpoint
├── (tabs)/             # Tab navigation screens
├── components/         # Reusable components
├── contexts/           # React contexts (Theme, Watchlist)
├── db/                 # Database schema and client
├── screens/            # Screen components
├── service/            # Business logic (watchlist operations)
└── theme/              # Theme configuration
```

## Security Considerations

### Environment Variables

- `ALPHA_VANTAGE_API_KEY`: Alpha Vantage API key (required)
- Fallback to demo data when API fails

### Input Validation

- Query parameter validation before external API calls
- URL encoding for search terms
- Type checking for numeric parameters

### Rate Limiting

- Relies on Alpha Vantage API rate limits
- Implements demo data fallback for development

## Notes

- Uses demo data fallback when API fails or rate limits are exceeded
- Implements debounced search to reduce API calls
- Chart data is filtered and optimized based on selected timeframe
- Watchlist data persists locally in SQLite database
- Theme preference is stored and persists between app sessions
