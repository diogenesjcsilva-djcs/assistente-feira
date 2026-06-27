"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { MapPin, Navigation as NavIcon, Star, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface RecommendationItem {
  productId: number;
  name: string;
  found: boolean;
  price: number;
  qty: number;
}

interface Recommendation {
  store: {
    id: number;
    name: string;
    address: string;
    distance: number;
  };
  total: number;
  itemsFound: number;
  totalItems: number;
  items: RecommendationItem[];
}

function RecommendationContent() {
  const searchParams = useSearchParams();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const isFallback = searchParams.get('fallback') === 'true';

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendation() {
      if (!lat || !lng) {
        setError("Coordenadas GPS não recebidas.");
        setLoading(false);
        return;
      }

      const savedList = localStorage.getItem('shopping_list');
      if (!savedList) {
        setError("Sua lista de compras está vazia.");
        setLoading(false);
        return;
      }

      let items = [];
      try {
        items = JSON.parse(savedList);
      } catch (e) {
        setError("Erro ao ler lista de compras.");
        setLoading(false);
        return;
      }

      if (items.length === 0) {
        setError("Adicione itens à sua lista antes de buscar.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radiusKm: 25, // Raio padrão de 25km
            items
          })
        });

        const data = await res.json();
        if (res.ok) {
          setRecommendations(data.recommendations || []);
        } else {
          setError(data.error || "Erro ao calcular melhor preço.");
        }
      } catch (err) {
        setError("Falha na conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendation();
  }, [lat, lng]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-color)" />
        <p style={{ color: 'var(--text-secondary)' }}>Calculando rotas e menores preços nas proximidades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <XCircle size={48} color="#ff4b4b" style={{ marginBottom: '1rem' }} />
        <h3>Oops!</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error}</p>
        <Link href="/list" className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
          Voltar para Lista
        </Link>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <MapPin size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
        <h3>Nenhuma loja encontrada</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Não encontramos nenhum mercado com preços cadastrados num raio de 25km da sua localização.
        </p>
        <Link href="/scan/receipt" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Escanear Nota Fiscal (Alimentar Banco)
        </Link>
      </div>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {isFallback && (
        <div className="glass-card" style={{ borderColor: 'rgba(255, 193, 7, 0.4)', padding: '0.8rem 1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          <p style={{ color: '#ffc107', fontSize: '0.85rem', margin: 0 }}>
            ⚠️ Usando localização simulada de Paulista-PE para demonstração.
          </p>
        </div>
      )}

      {recommendations.map((rec, index) => {
        const isBestOption = index === 0;
        
        return (
          <div 
            key={rec.store.id} 
            className="glass-card" 
            style={isBestOption ? { borderColor: 'var(--accent-color)', boxShadow: '0 0 25px rgba(102, 252, 241, 0.15)' } : {}}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {isBestOption && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Star size={16} color="var(--accent-color)" fill="var(--accent-color)" />
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '0.85rem' }}>Melhor Opção</span>
                  </div>
                )}
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{rec.store.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                  <MapPin size={14} /> a {rec.store.distance} km de você
                </p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Estimado</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>R$ {rec.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>
                Itens da Lista ({rec.itemsFound} de {rec.totalItems} encontrados):
              </h4>
              
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {rec.items.map(item => (
                  <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: item.found ? '#fff' : 'var(--text-secondary)' }}>
                      {item.found ? (
                        <CheckCircle size={14} color="var(--accent-color)" />
                      ) : (
                        <XCircle size={14} color="#ff4b4b" />
                      )}
                      {item.name} {item.qty > 1 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>(x{item.qty})</span>}
                    </span>
                    
                    <span style={{ fontWeight: 500 }}>
                      {item.found ? `R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}` : 'Não encontrado'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.store.name + ' ' + (rec.store.address || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary" 
              style={{ marginTop: '1.5rem', padding: '0.6rem' }}
            >
              <NavIcon size={16} />
              Como Chegar
            </a>
          </div>
        );
      })}
    </section>
  );
}

export default function MapPage() {
  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/list" style={{ color: 'var(--accent-color)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ margin: 0 }}>Lojas Próximas</h2>
      </header>

      <Suspense fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--accent-color)" />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados da rota...</p>
        </div>
      }>
        <RecommendationContent />
      </Suspense>
    </main>
  );
}
