import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      // Retorna os primeiros 10 produtos caso a busca esteja vazia
      const allProducts = await db.select().from(products).limit(10);
      return NextResponse.json({ products: allProducts });
    }

    // Busca produtos por parte do nome ou pelo código de barras (EAN)
    const filteredProducts = await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.barcode, `%${query}%`)
        )
      )
      .limit(10);

    return NextResponse.json({ products: filteredProducts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
