import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Exibe um aviso amigável em vez de quebrar a inicialização do Next.js (importante para o build na Vercel)
  console.warn("⚠️ AVISO: A variável de ambiente DATABASE_URL não está configurada!");
}

// Inicializa com um fallback mockado caso esteja indefinido para evitar que o Next.js quebre ao iniciar
const sql = neon(databaseUrl || 'postgresql://placeholder_user:placeholder_pass@placeholder-host.neon.tech/neondb');
export const db = drizzle(sql, { schema });
