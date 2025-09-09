# Stock Trading App - Groww Assignment

## 📱 Application Demo

**[🔗 Download APK & View Demo - Google Drive](https://drive.google.com/drive/folders/1W84U7bnJXRuQXl-Fa9afANKCVWX2-IQO?usp=sharing)**

Contains: APK file, screenshots, and demo video

A React Native stock market application built with Expo, featuring market data visualization, interactive charts, and portfolio management using Alpha Vantage API.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Frontend Workflow](#frontend-workflow)
- [Backend Workflow](#backend-workflow)
- [Performance Optimizations](#performance-optimizations)
- [Installation Guide](#installation-guide)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Database Implementation](#database-implementation)
- [Security Considerations](#security-considerations)

---

## Features

### Core Functionality

- _Market Data Display_: Top gainers/losers from Alpha Vantage API
- _Stock Search_: Debounced search with 500ms delay, minimum 2 characters
- _Interactive Charts_: 6 timeframes (1D, 1W, 1M, 3M, 6M, 1Y) using LineChart
- _Portfolio Management_: Create and manage multiple watchlists with SQLite storage
- _Infinite Scroll Pagination_: Load more stocks with 20 items per page
- _Theme Support_: Manual light/dark theme toggle

### User Interface

- _Tab Navigation_: Home screen (market data) and Watchlist screen
- _Modal Navigation_: Stock detail view and paginated stock lists
- _Loading States_: Activity indicators during data fetching
- _Error Handling_: User-friendly error messages with retry buttons

---

## Technology Stack

### Frontend Framework

- _React Native_ 0.79.6 with Expo SDK 53
- _TypeScript_ 5.8.3 with strict mode enabled
- _Expo Router_ 5.1.5 for file-based navigation
- _React Native Chart Kit_ 6.12.0 for data visualization

### Data Management

- _Alpha Vantage API_ for market data
- _SQLite_ with Expo SQLite 15.2.14 for local storage
- _Drizzle ORM_ 0.44.5 for database operations
- _React Context API_ for state management

### Development Environment

- _ESLint_ 9.25.0 with Expo configuration
- _Drizzle Kit_ 0.31.4 for database schema management
- _TypeScript_ for type safety and development experience

---

## System Architecture

### Application Pattern

_Client-Side Service Module Pattern_: All API calls are made directly from the client using service modules in services.ts. No backend server - pure React Native application with local SQLite storage.

### Service Module Organization

**Five service modules in services.ts:**

- _stockDataService_: Market data retrieval with client-side pagination
- _searchService_: Symbol search with debounced input
- _timeSeriesService_: Historical price data with timeframe filtering
- _companyService_: Company fundamentals and financial metrics
- _healthService_: Application status monitoring

### Navigation Architecture

Tab Navigation (app/(tabs)/)
├── index.tsx → homescreen.tsx (Market overview & search)
└── explore.tsx → watchlistscreen.tsx (Portfolio management)

Modal Screens (app/screens/)
├── detailscreen.tsx (Stock details & charts)
└── stocklistscreen.tsx (Paginated stock lists)

### State Management Strategy

- _React Context_: ThemeContext (theme toggle) + WatchlistContext (portfolio state)
- _Local State_: Component-level useState for UI states and API data
- _Persistent Storage_: SQLite for watchlists, in-memory for theme preferences

---

## Data Flow

### Client-Side Data Processing

Since this is a _client-side only application_, all data processing happens on the device:

_API Request Flow:_

Component → Service Function → fetch() → Alpha Vantage → JSON Response → Data Mapping → setState()

_Request Processing Steps:_

1. _HTTP Request_: fetch() call with hardcoded API_KEY
2. _Response Validation_: if (!response.ok) throws error with status code
3. _JSON Parsing_: await response.json()
4. _Data Validation_: Basic checks like if (!data.top_gainers)
5. _Data Transformation_: mapStockData() transforms API fields to TypeScript interface
6. _Error Handling_: try/catch blocks with console.error() and throw new Error()

_Local Database Flow:_

User Action → watchlistService function → getDb() → Drizzle Query → SQLite

_Database Operations:_

1. _Initialization_: CREATE TABLE IF NOT EXISTS SQL statements in initDatabase()
2. _Connection_: SQLite.openDatabaseSync('watchlist.db')
3. _Queries_: Drizzle ORM methods like db.select().from(watchlist)
4. _Error Handling_: Basic try/catch with console.error() logging

---

## Frontend Workflow

### Component-Level Implementation

_Screen Components and Their Responsibilities:_

**Home Screen (homescreen.tsx):**

- _Data Fetching_: useEffect(() => { fetchData() }) calls stockDataService.getStockData() on mount
- _Search Implementation_: const debouncedSearch = useCallback(debounce(async (query) => {...}, 500))
- _State Management_: useState for gainers, losers, loading, searchResults, searchLoading
- _Navigation_: router.push('/screens/detailscreen?symbol=${symbol}') and stocklist navigation

**Detail Screen (detailscreen.tsx):**

- _Parallel Data Loading_: fetchCompanyData() and fetchTimeSeriesData() called simultaneously in same useEffect
- _Chart Rendering_: <LineChart> component from react-native-chart-kit
- _Watchlist Integration_: const { addCompanyToWatchlist } = useWatchlist() hook
- _Timeframe Selection_: const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y"] array

**Stock List Screen (stocklistscreen.tsx):**

- _Infinite Scroll_: <FlatList onEndReached={handleLoadMore} onEndReachedThreshold={0.1}>
- _Pagination Logic_: fetchStocks(pageNum, isLoadMore) with page increment
- _Load More Prevention_: if (!loadingMore && hasMore) condition check
- _Data Appending_: setStocks(prev => [...prev, ...stockData]) for seamless scrolling

**Watchlist Screen (watchlistscreen.tsx):**

- _Context Integration_: Uses useWatchlist() hook for CRUD operations
- _List Rendering_: <FlatList> for watchlists and companies
- _Navigation_: Direct navigation to stock details on item press

---

## Backend Workflow

### Client-Side Data Processing

Since this is a _client-side only application_, all "backend" operations happen on the device:

_API Request Processing:_

User Action → Component Event → Service Function → fetch() → Alpha Vantage API → JSON Response → Data Mapping → Component State Update → UI Re-render

_Service Module Operations (Actual Implementation):_

1. _stockDataService.getStockData()_: fetch(BASE_URL + "?function=TOP_GAINERS_LOSERS"), applies client-side pagination with slice()
2. _searchService.searchSymbols()_: fetch(BASE_URL + "?function=SYMBOL_SEARCH") with keyword encoding
3. _timeSeriesService.getTimeSeries()_: fetch() calls TIME_SERIES_INTRADAY (1D) or TIME_SERIES_DAILY (1W-1Y)
4. _companyService.getCompanyData()_: fetch(BASE_URL + "?function=OVERVIEW") for company fundamentals
5. _healthService.getStatus()_: Returns { status: "UP" } object (no API call)

_Local Database Workflow:_

User Action → Context Method → watchlistService Function → getDb() → Drizzle Query → SQLite Database → Result → Context State Update → UI Refresh

_Database Transaction Flow:_

1. _Connection_: SQLite.openDatabaseSync('watchlist.db') creates/opens database
2. _Initialization_: initDatabase() runs CREATE TABLE IF NOT EXISTS statements
3. _CRUD Operations_: Drizzle ORM methods (db.select(), db.insert(), db.delete())
4. _Error Handling_: try/catch blocks with console.error() logging
5. _State Sync_: Context providers update component state after database operations

---

## Performance Optimizations

### Search Implementation

- _Debounced Input_: 500ms delay reduces API calls significantly
- _Character Threshold_: Prevents API calls for queries under 2 characters
- _Result Management_: Automatic clearing for short queries

### Pagination System

- _Client-Side Pagination_: stockDataService.getStockData({ page, limit }) with slice() operation
- _Page Management_: const page = options.page || 1; const limit = options.limit || 20
- _Data Slicing_: sourceData.slice(startIndex, endIndex) for 20 items per page
- _Pagination Metadata_: Returns { page, limit, total, hasMore } object
- _State Tracking_: hasMore boolean based on endIndex < sourceData.length

### List Rendering

- _Infinite Scroll_: FlatList onEndReached={handleLoadMore} with 0.1 threshold
- _Load More Logic_: if (!loadingMore && hasMore) prevents duplicate requests
- _Data Appending_: setStocks(prev => [...prev, ...stockData]) for seamless scrolling
- _Loading States_: Separate loading vs loadingMore indicators

### Chart Optimization

- _Client-Side Filtering_: Timeframe data processing without additional API calls
- _Responsive Design_: Dynamic chart sizing based on screen dimensions
- _Conditional Rendering_: Chart updates only when timeframe changes

### Memory Management

- _Component Cleanup_: useEffect cleanup functions prevent memory leaks
- _Context Optimization_: useMemo for context values to prevent re-renders
- _State Management_: Local state cleared appropriately on component unmount

---

## Installation Guide

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: npm install -g @expo/cli
- Android Studio (Android) or Xcode (iOS)

### Setup Instructions

1. _Clone and Install Dependencies:_

bash
git clone <repository-url>
cd growwass
npm install

2. _Configure Alpha Vantage API Key:_

_Option A: Direct Configuration (Recommended for testing)_

typescript
// In app/services.ts, line 1
const API_KEY = "your_alpha_vantage_api_key_here";

_Option B: Environment Variables_

bash

# Create .env file

EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY=your_api_key_here

3. _Start Development Server:_

bash
npm start

# Then press 'a' for Android, 'i' for iOS, or scan QR code

### Production Build

bash
npm install -g @expo/eas-cli
eas build --platform android

---

## Project Structure

growwass/
├── app/
│ ├── (tabs)/ # Tab navigation
│ │ ├── index.tsx # Home tab → homescreen.tsx
│ │ └── explore.tsx # Watchlist tab → watchlistscreen.tsx
│ ├── components/ # Custom components
│ │ └── ThemeToggleCompact.tsx
│ ├── contexts/ # React Context providers
│ │ ├── ThemeContext.tsx # Theme state management
│ │ └── WatchlistContext.tsx # Watchlist operations
│ ├── db/ # Database layer
│ │ ├── client.ts # SQLite connection
│ │ └── schema.ts # Drizzle schema definitions
│ ├── screens/ # Screen components
│ │ ├── homescreen.tsx # Market data & search
│ │ ├── detailscreen.tsx # Stock details & charts
│ │ ├── stocklistscreen.tsx # Paginated lists
│ │ └── watchlistscreen.tsx # Portfolio management
│ ├── service/ # Business logic
│ │ └── watchlist.ts # Watchlist CRUD operations
│ ├── services.ts # API service modules
│ └── theme/ # Theme configuration
├── components/ # Expo default components
├── constants/ # App constants
└── assets/ # Images and fonts

---

## API Integration

### Alpha Vantage Endpoints

1. _TOP_GAINERS_LOSERS_: Market movers data for home screen
2. _SYMBOL_SEARCH_: Stock symbol lookup for search functionality
3. _TIME_SERIES_INTRADAY_: 5-minute intervals for 1D charts
4. _TIME_SERIES_DAILY_: Daily data for 1W-1Y timeframes
5. _OVERVIEW_: Company fundamentals and financial metrics

### Data Processing Implementation

- _Type Safety_: TypeScript interfaces for all API responses
- _Error Handling_: HTTP status codes and API error message parsing
- _Data Transformation_: Consistent field mapping across service modules
- _Rate Limiting_: Graceful handling of Alpha Vantage API limits

---

## Database Implementation

### SQLite Schema Design

_Table Definitions:_

sql
-- Watchlists
CREATE TABLE watchlist (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
created_at TEXT DEFAULT datetime('now')
);

-- Companies in watchlists
CREATE TABLE companies (
id INTEGER PRIMARY KEY AUTOINCREMENT,
symbol TEXT NOT NULL,
name TEXT NOT NULL,
watchlist_id INTEGER NOT NULL,
added_at TEXT DEFAULT datetime('now'),
FOREIGN KEY (watchlist_id) REFERENCES watchlist(id) ON DELETE CASCADE
);

### Database Operations

- _Create_: New watchlists and company entries
- _Read_: Fetch watchlists with associated companies
- _Delete_: Cascade deletion maintains referential integrity
- _Indexing_: Primary keys and foreign keys for query optimization

---

## Security Considerations

### API Key Management

- _Development_: Direct configuration in services.ts
- _Production_: Environment variables with EXPO*PUBLIC* prefix
- _Rate Limiting_: Alpha Vantage free tier (5 requests/minute, 500/day)

### Data Protection

- _Local Storage_: Only watchlist data stored locally
- _No Sensitive Data_: No financial credentials or personal information
- _HTTPS Communication_: All API calls use secure connections

---

## License

This project is developed as part of the Groww technical assignment for educational and evaluation purposes.
