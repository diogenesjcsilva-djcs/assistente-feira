import fs from 'fs';
import path from 'path';

// Load .env.local manually BEFORE importing anything else
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
} catch (e) {
  console.error("Erro ao carregar .env.local:", e);
}

// Dynamically import after env is loaded
async function test() {
  try {
    const { GET } = await import('./src/app/api/products/ean/route.ts');
    const req = new Request('http://localhost/api/products/ean?barcode=7896051020127');
    const res = await GET(req);
    const data = await res.json();
    console.log("=== API Response for Gina EAN 7896051020127 ===");
    console.log(data);
  } catch (err) {
    console.error("Erro no teste da API:", err);
  }
}

test();
