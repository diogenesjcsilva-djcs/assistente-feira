import Link from 'next/link';
import { ScanBarcode, Receipt, PlusCircle, Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="container animate-fade-in">
      <header className="app-header">
        <h1>Assistente de Compras</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Economize tempo e dinheiro.</p>
      </header>

      <section>
        <h2>Ações Rápidas</h2>
        
        <div className="glass-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/scan/receipt" className="btn btn-primary">
              <Receipt size={20} />
              Ler Cupom Fiscal (QR Code)
            </Link>
            
            <Link href="/scan/product" className="btn btn-secondary">
              <ScanBarcode size={20} />
              Ler Produto (Código de Barras)
            </Link>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Sua Lista Atual</h3>
            <Activity size={24} color="var(--accent-color)" />
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Você não possui itens na sua lista de compras.
          </p>
          <Link href="/list" className="btn btn-secondary" style={{ width: 'auto', display: 'inline-flex' }}>
            <PlusCircle size={20} />
            Criar Nova Lista
          </Link>
        </div>
      </section>
    </main>
  );
}
