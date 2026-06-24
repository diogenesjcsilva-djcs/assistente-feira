"use client";

import { MapPin, Navigation as NavIcon, Star, CheckCircle } from 'lucide-react';

export default function MapPage() {
  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ paddingBottom: '1rem' }}>
        <h2>Melhor Preço</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Para os 3 itens da sua lista</p>
      </header>

      <section>
        {/* Recommended Store */}
        <div className="glass-card" style={{ borderColor: 'var(--accent-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Star size={20} color="var(--accent-color)" fill="var(--accent-color)" />
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>Recomendado</span>
              </div>
              <h3 style={{ margin: 0 }}>Supermercado Bom Preço</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                <MapPin size={14} /> a 2.5 km de você
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total da Lista</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>R$ 45,90</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Itens encontrados (3/3)</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span><CheckCircle size={14} color="var(--accent-color)" style={{ display: 'inline', marginRight: '5px' }}/> Arroz Branco 5kg</span>
                <span style={{ color: 'var(--text-secondary)' }}>R$ 25,00</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span><CheckCircle size={14} color="var(--accent-color)" style={{ display: 'inline', marginRight: '5px' }}/> Feijão Carioca 1kg</span>
                <span style={{ color: 'var(--text-secondary)' }}>R$ 8,00</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span><CheckCircle size={14} color="var(--accent-color)" style={{ display: 'inline', marginRight: '5px' }}/> Óleo de Soja 900ml</span>
                <span style={{ color: 'var(--text-secondary)' }}>R$ 12,90</span>
              </li>
            </ul>
          </div>

          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            <NavIcon size={20} />
            Navegar até lá
          </button>
        </div>

        {/* Other option */}
        <div className="glass-card" style={{ opacity: 0.8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Mercadinho da Esquina</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                <MapPin size={14} /> a 0.8 km de você
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>R$ 52,40</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
