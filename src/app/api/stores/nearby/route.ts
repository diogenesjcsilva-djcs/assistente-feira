import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseFloat(searchParams.get('radius') || '1.5'); 

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Coordenadas GPS ausentes.' }, { status: 400 });
    }

    const radiusMeters = radius * 1000;

    // 1. Busca estabelecimentos cadastrados localmente usando PostGIS
    const localStoresResult = await db.execute(sql`
      SELECT 
        id::text, 
        name, 
        document,
        address,
        ST_Distance(location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography) as distance,
        'local' as source
      FROM stores
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography, ${radiusMeters})
      ORDER BY distance ASC
    `);

    const localStores = localStoresResult.rows as any[];

    // 2. Busca externa via Google Places API (se configurada)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const externalStores: any[] = [];

    if (apiKey && apiKey !== 'coloque_sua_google_api_key_aqui') {
      try {
        console.log(`Buscando estabelecimentos próximos no Google Places API...`);
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200&type=supermarket|grocery_or_supermarket|convenience_store&key=${apiKey}`
        );
        
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.results && Array.isArray(googleData.results)) {
            googleData.results.forEach((place: any) => {
              // Evita duplicar se o mercado já estiver no banco local com o mesmo nome
              const alreadyExists = localStores.some(
                ls => ls.name.toLowerCase() === place.name.toLowerCase()
              );
              
              if (!alreadyExists) {
                externalStores.push({
                  id: `google-${place.place_id}`,
                  name: place.name,
                  document: `GOOGLE-${place.place_id}`,
                  address: place.vicinity || 'Endereço obtido via Google Maps',
                  distance: 0, // Assumido muito próximo (<200m)
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                  source: 'google'
                });
              }
            });
          }
        }
      } catch (googleErr: any) {
        console.warn("Falha ao consultar Google Places API:", googleErr.message);
      }
    }

    // Mescla resultados
    const allStores = [...localStores, ...externalStores];

    return NextResponse.json({ stores: allStores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
