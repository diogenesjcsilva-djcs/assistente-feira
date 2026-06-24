import Link from 'next/link';
import { ArrowLeft, Camera, QrCode } from 'lucide-react';

export default function ReceiptScanner() {
  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--accent-color)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ margin: 0 }}>Ler Cupom Fiscal</h2>
      </header>

      <section>
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            backgroundColor: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--accent-color-hover)',
            boxShadow: '0 0 20px rgba(102, 252, 241, 0.2)'
          }}>
            {/* Simulate camera feed */}
            <QrCode size={64} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
            
            {/* Scanner line animation */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'var(--accent-color)',
              boxShadow: '0 0 10px var(--accent-color)',
              animation: 'scanLine 2s linear infinite'
            }} />
          </div>
          
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
            Aponte a câmera para o QR Code do cupom fiscal NFC-e.
          </p>

          <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
            <Camera size={20} />
            Iniciar Câmera
          </button>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </main>
  );
}
