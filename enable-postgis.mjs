import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
async function run() {
  try {
    console.log("Habilitando a extensão PostGIS...");
    await sql`CREATE EXTENSION IF NOT EXISTS postgis;`;
    console.log("Extensão PostGIS habilitada com sucesso!");
  } catch (err) {
    console.error("Erro ao habilitar PostGIS:", err);
  }
}
run();
