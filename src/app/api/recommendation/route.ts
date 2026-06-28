import { NextResponse } from 'next/server';
import { db } from '@/db';
import { stores, products, prices } from '@/db/schema';
import { eq, inArray, and, sql } from 'drizzle-orm';

interface ReqItem {
  product: {
    id: number;
    name: string;
    barcode: string;
  };
  qty: number;
}

export async function POST(request: Request) {
  try {
    const { lat, lng, radiusKm, items } = await request.json();

    if (lat === undefined || lng === undefined || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    const radiusMeters = (radiusKm || 15) * 1000;
    const productIds = items.map((item: ReqItem) => item.product.id); // Extrai o id do produto

    // 1. Filtrar lojas qualificadas dentro do raio usando PostGIS
    const qualifiedStores = await db.execute(sql`
      SELECT 
        id, 
        name, 
        address,
        ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance
      FROM stores
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
      ORDER BY distance ASC
    `);

    const storesList = qualifiedStores.rows as unknown as { id: number, name: string, address: string, distance: number }[];

    if (storesList.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const storeIds = storesList.map(s => s.id);

    // 2. Buscar os preços mais recentes dos produtos selecionados nessas lojas
    const pricesList = await db
      .select({
        storeId: prices.storeId,
        productId: prices.productId,
        price: prices.price,
        productName: products.name
      })
      .from(prices)
      .innerJoin(products, eq(prices.productId, products.id))
      .where(
        and(
          inArray(prices.storeId, storeIds),
          inArray(prices.productId, productIds)
        )
      );

    // 3. Montar a resposta ordenando as lojas por economia e proximidade
    const recommendations = storesList.map(store => {
      const storePrices = pricesList.filter(p => p.storeId === store.id);
      
      let total = 0;
      const itemsDetails = items.map(reqItem => {
        const pInfo = storePrices.find(p => p.productId === reqItem.product.id);
        const unitPrice = pInfo ? parseFloat(pInfo.price) : 0;
        const subtotal = unitPrice * reqItem.qty;
        total += subtotal;
        
        return {
          productId: reqItem.product.id,
          name: pInfo ? pInfo.productName : reqItem.product.name,
          found: !!pInfo,
          price: unitPrice,
          qty: reqItem.qty
        };
      });

      const foundCount = itemsDetails.filter(i => i.found).length;

      return {
        store: {
          id: store.id,
          name: store.name,
          address: store.address,
          distance: parseFloat((store.distance / 1000).toFixed(1)) // Converte para Km
        },
        total: parseFloat(total.toFixed(2)),
        itemsFound: foundCount,
        totalItems: items.length,
        items: itemsDetails
      };
    });

    // Algoritmo de classificação:
    // 1º - Lojas que possuem mais itens da lista do usuário
    // 2º - Lojas com menor preço total
    recommendations.sort((a, b) => {
      if (b.itemsFound !== a.itemsFound) {
        return b.itemsFound - a.itemsFound;
      }
      return a.total - b.total;
    });

    return NextResponse.json({ recommendations });

  } catch (error: any) {
    console.error('Erro no algoritmo de recomendação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
