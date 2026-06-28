import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_nuJr7ZVGwQF6@ep-crimson-base-atiy7cdp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
async function run() {
  try {
    console.log("=== Lendo Lojas no Neon ===");
    const storesRes = await sql`select * from stores`;
    console.log(storesRes);

    console.log("\n=== Lendo Produtos no Neon ===");
    const productsRes = await sql`select * from products`;
    console.log(productsRes);

    console.log("\n=== Lendo Preços no Neon ===");
    const pricesRes = await sql`select * from prices`;
    console.log(pricesRes);
  } catch (err) {
    console.error("Erro:", err.message || err);
  }
}
run();
