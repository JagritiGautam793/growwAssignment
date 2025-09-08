import { and, eq } from 'drizzle-orm';
import { companies, getDb, watchlist } from '../db/client';
import { Company, InsertCompany, Watchlist } from '../db/schema';

export const watchlistService = {
  async getAllWatchlistItems(): Promise<Watchlist[]> {
    try {
      const db = getDb();
      const result = await db.select().from(watchlist).orderBy(watchlist.createdAt);
      return result;
    } catch (error) {
      console.error('Error fetching watchlist items:', error);
      throw error;
    }
  },

  async createWatchlistItem(name: string): Promise<Watchlist> {
    try {
      const db = getDb();
      const result = await db.insert(watchlist).values({ name }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating watchlist item:', error);
      throw error;
    }
  },

  async deleteWatchlistItem(id: number): Promise<Watchlist | undefined> {
    try {
      const db = getDb();
      const result = await db.delete(watchlist).where(eq(watchlist.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error deleting watchlist item:', error);
      throw error;
    }
  },

  async getWatchlistItemById(id: number): Promise<Watchlist | undefined> {
    try {
      const db = getDb();
      const result = await db.select().from(watchlist).where(eq(watchlist.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching watchlist item by id:', error);
      throw error;
    }
  },

  async addCompanyToWatchlist(companyData: Omit<InsertCompany, 'id' | 'addedAt'>): Promise<Company> {
    try {
      // Validate required fields
      if (!companyData.symbol || !companyData.name || !companyData.watchlistId) {
        throw new Error('Missing required fields: symbol, name, or watchlistId');
      }

      const db = getDb();
      const result = await db.insert(companies).values(companyData).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding company to watchlist:', error);
      throw error;
    }
  },

  async getCompaniesInWatchlist(watchlistId: number): Promise<Company[]> {
    try {
      const db = getDb();
      const result = await db.select().from(companies).where(eq(companies.watchlistId, watchlistId));
      return result;
    } catch (error) {
      console.error('Error fetching companies in watchlist:', error);
      throw error;
    }
  },

  async removeCompanyFromWatchlist(companyId: number): Promise<Company | undefined> {
    try {
      const db = getDb();
      const result = await db.delete(companies).where(eq(companies.id, companyId)).returning();
      return result[0];
    } catch (error) {
      console.error('Error removing company from watchlist:', error);
      throw error;
    }
  },

  async isCompanyInWatchlist(symbol: string, watchlistId: number): Promise<boolean> {
    try {
      const db = getDb();
      const result = await db.select().from(companies).where(
        and(eq(companies.symbol, symbol), eq(companies.watchlistId, watchlistId))
      );
      return result.length > 0;
    } catch (error) {
      console.error('Error checking if company is in watchlist:', error);
      throw error;
    }
  },

  async getAllCompanies(): Promise<Company[]> {
    try {
      const db = getDb();
      const result = await db.select().from(companies);
      return result;
    } catch (error) {
      console.error('Error fetching all companies:', error);
      throw error;
    }
  }
};