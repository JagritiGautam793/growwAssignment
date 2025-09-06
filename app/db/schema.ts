import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const watchlist = sqliteTable('watchlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default("datetime('now')"),
});

export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  watchlistId: integer('watchlist_id').notNull().references(() => watchlist.id, { onDelete: 'cascade' }),
  addedAt: text('added_at').default("datetime('now')"),
});

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = typeof watchlist.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;