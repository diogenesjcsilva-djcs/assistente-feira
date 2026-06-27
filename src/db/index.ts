import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Conexão com o banco Neon via HTTP (perfeito para Serverless Edge/Vercel)
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
