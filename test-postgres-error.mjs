import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_nuJr7ZVGwQF6@ep-crimson-base-atiy7cdp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
async function run() {
  try {
    console.log("Forçando um erro para inspecionar o objeto de erro do Neon...");
    await sql`select * from tabela_que_nao_existe`;
  } catch (err) {
    console.log("--- Inspeção de Erro ---");
    console.log("Chaves no objeto de erro:", Object.keys(err));
    console.log("Mensagem (.message):", err.message);
    console.log("Código SQL (.code):", err.code);
    console.log("Severidade (.severity):", err.severity);
    console.log("Detalhe (.detail):", err.detail);
    console.log("Objeto completo (JSON):", JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
}
run();
