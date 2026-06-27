"use client";

import { useState, useEffect } from 'react';
import { Trash2, Search, MapPin, Loader2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  barcode: string;
}

interface ListItem {
  product: Product;
  qty: number;
}

export default function ShoppingList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Carrega a lista salva anteriormente do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shopping_list');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Salva no localStorage sempre que a lista mudar
  const saveItems = (newItems: ListItem[]) => {
    setItems(newItems);
    localStorage.setItem('shopping_list', JSON.stringify(newItems));
  };

  // Busca produtos no backend ao digitar
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.products || []);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addProductToList = (product: Product) => {
    const existing = items.find(item => item.product.id === product.id);
    if (existing) {
      updateQty(product.id, existing.qty + 1);
    } else {
      const newItems = [...items, { product, qty: 1 }];
      saveItems(newItems);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeProduct(productId);
      return;
    }
    const newItems = items.map(item => 
      item.product.id === productId ? { ...item, qty: newQty } : item
    );
    saveItems(newItems);
  };

  const removeProduct = (productId: number) => {
    const newItems = items.filter(item => item.product.id !== productId);
    saveItems(newItems);
  };

  const handleFindCheapest = () => {
    if (items.length === 0) return;
    
    setLoadingGPS(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Seu navegador não suporta geolocalização.");
      setLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLoadingGPS(false);
        // Redireciona para o mapa passando as coordenadas
        router.push(`/map?lat=${latitude}&lng=${longitude}`);
      },
      (error) => {
        console.error(error);
        setLoadingGPS(false);
        // Fallback: Se o GPS falhar no teste, usamos a localização próxima à nossa loja Mix Mateus em Paulista-PE
        // Mix Mateus LJ 51 Paulista-PE Coordenadas: Lat -7.940989, Lng -34.856983 (Avenida Antônio Cabral de Souza)
        const fallbackLat = -7.940989;
        const fallbackLng = -34.856983;
        setGpsError("Acesso ao GPS recusado/indisponível. Usando Paulista-PE como base de teste.");
        
        setTimeout(() => {
          router.push(`/map?lat=${fallbackLat}&lng=${fallbackLng}&fallback=true`);
        }, 1500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ paddingBottom: '1rem' }}>
        <h2>Minha Lista</h2>
      </header>

      <section>
        {/* Busca de Produtos no Neon */}
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Pesquisar produto no banco..." 
                style={{ paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-color-secondary)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              marginTop: '5px',
              listStyle: 'none',
              padding: '0.5rem 0',
              boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {searchResults.map(prod => (
                <li 
                  key={prod.id} 
                  onClick={() => addProductToList(prod)}
                  style={{
                    padding: '0.8rem 1rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: '#fff' }}>{prod.name}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EAN: {prod.barcode}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Itens na Lista */}
        <div className="glass-card">
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
              Sua lista está vazia. Pesquise e adicione itens cadastrados acima!
            </p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map(item => (
                <li key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.product.name}</h4>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>EAN: {item.product.barcode}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem' }}>
                      <button 
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeProduct(item.product.id)} 
                      style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {gpsError && (
          <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{gpsError}</p>
        )}

        <button 
          onClick={handleFindCheapest}
          disabled={items.length === 0 || loadingGPS}
          className="btn btn-primary" 
          style={{ marginTop: '1rem' }}
        >
          {loadingGPS ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Obtendo GPS...
            </>
          ) : (
            <>
              <MapPin size={20} />
              Encontrar Melhor Preço
            </>
          )}
        </button>
      </section>
    </main>
  );
}
