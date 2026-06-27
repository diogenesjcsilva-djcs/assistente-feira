"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Barcode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ProductScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 100 } }, // Formato retangular ideal para código de barras
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          scanner?.clear();
          setIsScanning(false);
        },
        (error) => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--accent-color)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ margin: 0 }}>Ler Produto</h2>
      </header>

      <section>
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          
          {!isScanning && !scanResult && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Barcode size={64} color="var(--text-secondary)" />
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Centralize o código de barras (EAN) do produto.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsScanning(true)}>
                <Camera size={20} />
                Iniciar Câmera
              </button>
            </>
          )}

          {isScanning && (
            <div id="barcode-reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-color-secondary)' }}></div>
          )}

          {scanResult && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Produto Detectado!</h3>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                EAN: {scanResult}
              </p>
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setScanResult(null)}>
                Escanear Novamente
              </button>
            </div>
          )}
        </div>

        <div className="glass-card">
          <h3>Inserção Manual</h3>
          <div className="input-group">
            <label>Código de Barras (EAN)</label>
            <input type="text" className="input-field" placeholder="Ex: 7891010101010" />
          </div>
          <button className="btn btn-secondary">Buscar Produto</button>
        </div>
      </section>
    </main>
  );
}
