import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, varchar, text, geometry } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

const storesWithLocation = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  document: varchar('document', { length: 20 }).unique(),
  address: text('address'),
  location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 })
});

const sql = neon("postgresql://neondb_owner:npg_nuJr7ZVGwQF6@ep-crimson-base-atiy7cdp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
const db = drizzle(sql);

async function run() {
  try {
    console.log("Testando Drizzle ORM COM a coluna location...");
    const res = await db.select().from(storesWithLocation).where(eq(storesWithLocation.document, '00000000000000')).limit(1);
    console.log("Sucesso Drizzle com location!", res);
  } catch (err) {
    console.error("Erro Drizzle com location:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
}
run();
