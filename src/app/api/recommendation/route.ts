import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, userLocation, radius } = body;

    // Mocking database and spatial search logic
    const recommendations = [
      {
        store: {
          id: 1,
          name: 'Supermercado Bom Preço',
          distance: 2.5,
        },
        total: 45.90,
        itemsFound: 3,
        items: [
          { name: 'Arroz Branco 5kg', price: 25.00 },
          { name: 'Feijão Carioca 1kg', price: 8.00 },
          { name: 'Óleo de Soja 900ml', price: 12.90 },
        ]
      },
      {
        store: {
          id: 2,
          name: 'Mercadinho da Esquina',
          distance: 0.8,
        },
        total: 52.40,
        itemsFound: 3,
        items: [
          { name: 'Arroz Branco 5kg', price: 28.50 },
          { name: 'Feijão Carioca 1kg', price: 9.00 },
          { name: 'Óleo de Soja 900ml', price: 14.90 },
        ]
      }
    ];

    return NextResponse.json({ recommendations });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao calcular recomendação.' }, { status: 500 });
  }
}
