import { pgTable, serial, varchar, text, decimal, integer, timestamp, geometry } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  document: varchar('document', { length: 20 }).unique(), // CNPJ
  address: text('address'),
  location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }) // Geometria PostGIS
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  barcode: varchar('barcode', { length: 50 }).unique().notNull(), // EAN
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 })
});

export const prices = pgTable('prices', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  storeId: integer('store_id').references(() => stores.id, { onDelete: 'cascade' }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Relacionamentos ORM
export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
  store: one(stores, {
    fields: [prices.storeId],
    references: [stores.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  prices: many(prices),
}));
