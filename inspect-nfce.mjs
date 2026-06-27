import * as fs from 'fs';
import * as cheerio from 'cheerio';

const url = 'http://nfce.sefaz.pe.gov.br/nfce-web/consultarNFCe?p=26260620300157006261651080000250421826292794|2|1|1|5AAF15B7D81FFEB918B04136B0A08DCD7B7BBE49';

async function run() {
  try {
    console.log("Tentando baixar a nota fiscal real de PE...");
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP erro status: ${response.status}`);
    }
    
    const html = await response.text();
    fs.writeFileSync('nfce-temp.html', html);
    console.log(`Sucesso! HTML baixado e salvo em nfce-temp.html (${html.length} bytes)`);
    
    const $ = cheerio.load(html);
    
    // Mostra as tags estruturais encontradas
    console.log("\n--- Elementos no HTML ---");
    console.log("Número de tabelas:", $('table').length);
    console.log("Número de linhas (tr):", $('tr').length);
    console.log("Divs principais (IDs):", $('div[id]').map((i, el) => $(el).attr('id')).get().slice(0, 10));
    
    // Tentativa de achar o nome do mercado
    console.log("\n--- Texto das primeiras tags com classe ou ID comuns ---");
    console.log("ID u20:", $('#u20').text().trim());
    console.log("ID conteudo:", $('#conteudo').text().trim().substring(0, 100));
    console.log("Classe txtTopo:", $('.txtTopo').text().trim().substring(0, 100));
    
  } catch (err) {
    console.error("Erro no script de inspeção:", err.message || err);
  }
}
run();
