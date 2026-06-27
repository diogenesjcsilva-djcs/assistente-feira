import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Ignoramos tabelas geradas automaticamente pelo PostGIS (como spatial_ref_sys)
  tablesFilter: ["stores", "products", "prices"],
});
