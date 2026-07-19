import Link from 'next/link';
import { ScanBarcode, Receipt, PlusCircle, Activity, ShoppingCart } from 'lucide-react';

export default function Home() {
  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="app-header">
        <h1>Assistente de Compras</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Economize tempo e dinheiro.</p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
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
        </div>

        <div>
          <h2>Carrinho Atual</h2>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>PDV da Feira</h3>
              <ShoppingCart size={24} color="var(--accent-color)" />
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Acompanhe e totalize o valor da sua compra direto no carrinho antes de chegar ao caixa.
            </p>
            <Link href="/cart" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
              <ShoppingCart size={20} />
              Ir para o Carrinho
            </Link>
          </div>
        </div>

        <div>
          <h2>Lista de Compras</h2>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Sua Lista Ativa</h3>
              <Activity size={24} color="var(--accent-color)" />
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Monte sua lista planejada de itens e encontre o supermercado mais barato na região.
            </p>
            <Link href="/list" className="btn btn-secondary" style={{ width: 'auto', display: 'inline-flex' }}>
              <PlusCircle size={20} />
              Criar Nova Lista
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
