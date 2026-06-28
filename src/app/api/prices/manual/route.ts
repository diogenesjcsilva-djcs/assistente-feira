import { NextResponse } from 'next/server';
import { db } from '@/db';
import { stores, products, prices } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      barcode, 
      productName, 
      storeId, 
      newStoreName, 
      lat, 
      lng, 
      price,
      googleStoreName,
      googleStoreAddress,
      googleStoreLat,
      googleStoreLng
    } = body;

    if (!barcode || !productName || !price) {
      return NextResponse.json({ error: 'Dados incompletos (EAN, nome e preço são obrigatórios).' }, { status: 400 });
    }

    // 1. Cadastra ou Vincula o Produto
    let productId;
    const [existingProduct] = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
    
    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const [newProduct] = await db.insert(products).values({
        barcode,
        name: productName,
        category: 'Geral'
      }).returning({ id: products.id });
      productId = newProduct.id;
    }

    // 2. Cadastra ou Vincula a Loja
    let finalStoreId;

    if (storeId && storeId.toString().startsWith('google-')) {
      // Se selecionou uma loja do Google, cadastra ela no banco local na hora
      const googleId = storeId.replace('google-', '');
      const [newStore] = await db.insert(stores).values({
        name: googleStoreName,
        document: `GOOGLE-${googleId}`,
        address: googleStoreAddress || 'Endereço Google Maps',
        location: sql`ST_SetSRID(ST_MakePoint(${googleStoreLng}, ${googleStoreLat}), 4326)`
      }).returning({ id: stores.id });
      finalStoreId = newStore.id;
    } else if (!storeId && newStoreName && lat && lng) {
      // Cadastro 100% manual de novo mercado pelo usuário
      const [newStore] = await db.insert(stores).values({
        name: newStoreName,
        document: `MANUAL-${Date.now()}`,
        address: 'Cadastrado manualmente via GPS',
        location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`
      }).returning({ id: stores.id });
      finalStoreId = newStore.id;
    } else {
      finalStoreId = parseInt(storeId);
    }

    if (!finalStoreId) {
      return NextResponse.json({ error: 'Nenhum estabelecimento foi associado.' }, { status: 400 });
    }

    // 3. Grava o preço
    await db.insert(prices).values({
      productId,
      storeId: finalStoreId,
      price: price.toString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao salvar registro de preço manual:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
