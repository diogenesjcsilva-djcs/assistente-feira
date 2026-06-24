"use client";

import { useState } from 'react';
import { Trash2, Search, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ShoppingList() {
  const [items, setItems] = useState([
    { id: 1, name: 'Arroz Branco 5kg', qty: 1 },
    { id: 2, name: 'Feijão Carioca 1kg', qty: 2 },
    { id: 3, name: 'Óleo de Soja 900ml', qty: 3 },
  ]);

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ paddingBottom: '1rem' }}>
        <h2>Minha Lista</h2>
      </header>

      <section>
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-field" placeholder="Adicionar produto..." style={{ paddingLeft: '40px' }} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map(item => (
              <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h4>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Qtd: {item.qty}</span>
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/map" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          <MapPin size={20} />
          Encontrar Melhor Preço
        </Link>
      </section>
    </main>
  );
}
