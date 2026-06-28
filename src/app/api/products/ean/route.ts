import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json({ error: 'Código de barras não fornecido.' }, { status: 400 });
    }

    // 1. Busca local no Neon
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);

    if (product) {
      return NextResponse.json({ found: true, source: 'local', product });
    }

    // 2. Consulta externa no OpenFoodFacts (100% gratuita, sem limites de requisição)
    try {
      console.log(`Buscando EAN ${barcode} no OpenFoodFacts...`);
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`);
      
      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          // Tenta pegar o nome em português, senão pega em inglês
          const name = offData.product.product_name_pt || offData.product.product_name || '';
          if (name) {
            return NextResponse.json({
              found: true,
              source: 'openfoodfacts',
              product: {
                name,
                barcode
              }
            });
          }
        }
      }
    } catch (offErr: any) {
      console.warn("Falha ao consultar OpenFoodFacts:", offErr.message);
    }

    return NextResponse.json({ found: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
