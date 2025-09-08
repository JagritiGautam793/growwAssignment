
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { companies, watchlist } from './schema';

// Initialize database with proper error handling for build process
let expo: SQLite.SQLiteDatabase | null = null;
let db: any = null;

try {
  expo = SQLite.openDatabaseSync('watchlist.db');
  db = drizzle(expo);
} catch (error) {
  // Fallback for build process - defer initialization
  console.warn('Database initialization deferred until runtime');
}

export const initDatabase = async (): Promise<void> => {
  try {
    // Initialize database if it wasn't properly created during build
    if (!expo || !db) {
      expo = SQLite.openDatabaseSync('watchlist.db');
      db = drizzle(expo);
    }
    
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

// Export a function that ensures database is initialized
export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export { companies, watchlist };

