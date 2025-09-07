// database.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { companies, watchlist } from './schema';

// Open the database
const expo = SQLite.openDatabaseSync('watchlist.db');

// Create drizzle instance
export const db = drizzle(expo);

// Initialize database with table creation
export const initDatabase = async (): Promise<void> => {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
    await db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        watchlist_id INTEGER NOT NULL,
        added_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (watchlist_id) REFERENCES watchlist (id) ON DELETE CASCADE
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export { companies, watchlist };

