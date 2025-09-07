import React, { createContext, useContext, useEffect, useState } from "react";
import { initDatabase } from "../db/client";
import { watchlistService } from "../service/watchlist";

interface Watchlist {
  id: number;
  name: string;
  createdAt: string | null;
}

interface Company {
  id: number;
  symbol: string;
  name: string;
  watchlistId: number;
  addedAt: string | null;
}

interface WatchlistContextType {
  watchlists: Watchlist[];
  companies: Company[];
  selectedWatchlist: Watchlist | null;
  loading: boolean;
  refreshWatchlists: () => Promise<void>;
  refreshCompanies: (watchlistId: number) => Promise<void>;
  addCompanyToWatchlist: (
    companyData: Omit<Company, "id" | "addedAt">
  ) => Promise<void>;
  removeCompanyFromWatchlist: (companyId: number) => Promise<void>;
  createWatchlist: (name: string) => Promise<Watchlist>;
  setSelectedWatchlist: (watchlist: Watchlist | null) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined
);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refreshWatchlists = async () => {
    try {
      const watchlistData = await watchlistService.getAllWatchlistItems();
      setWatchlists(watchlistData);
      if (watchlistData.length > 0 && !selectedWatchlist) {
        setSelectedWatchlist(watchlistData[0]);
      }
    } catch (error) {
      console.error("Error loading watchlists:", error);
    }
  };

  const refreshCompanies = async (watchlistId: number) => {
    try {
      const companiesData = await watchlistService.getCompaniesInWatchlist(
        watchlistId
      );
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  const addCompanyToWatchlist = async (
    companyData: Omit<Company, "id" | "addedAt">
  ) => {
    try {
      await watchlistService.addCompanyToWatchlist(companyData);
      // Refresh companies if this is the currently selected watchlist
      if (
        selectedWatchlist &&
        selectedWatchlist.id === companyData.watchlistId
      ) {
        await refreshCompanies(companyData.watchlistId);
      }
    } catch (error) {
      console.error("Error adding company to watchlist:", error);
      throw error;
    }
  };

  const removeCompanyFromWatchlist = async (companyId: number) => {
    try {
      await watchlistService.removeCompanyFromWatchlist(companyId);
      if (selectedWatchlist) {
        await refreshCompanies(selectedWatchlist.id);
      }
    } catch (error) {
      console.error("Error removing company:", error);
      throw error;
    }
  };

  const createWatchlist = async (name: string) => {
    try {
      const newWatchlist = await watchlistService.createWatchlistItem(name);
      await refreshWatchlists();
      return newWatchlist;
    } catch (error) {
      console.error("Error creating watchlist:", error);
      throw error;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        await refreshWatchlists();
      } catch (error) {
        console.error("Error initializing database:", error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (selectedWatchlist) {
      refreshCompanies(selectedWatchlist.id);
    }
  }, [selectedWatchlist]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlists,
        companies,
        selectedWatchlist,
        loading,
        refreshWatchlists,
        refreshCompanies,
        addCompanyToWatchlist,
        removeCompanyFromWatchlist,
        createWatchlist,
        setSelectedWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
};
