import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_nuJr7ZVGwQF6@ep-crimson-base-atiy7cdp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
async function run() {
  try {
    console.log("Testando consulta direta no Neon...");
    const res = await sql`select "id", "name", "document", "address", "location" from "stores" limit 1`;
    console.log("Sucesso na consulta!", res);
  } catch (err) {
    console.error("Erro exato da consulta:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
}
run();
