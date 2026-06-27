"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, QrCode, Loader2, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ReceiptScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{ storeName: string, itemsSaved: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(
        async (decodedText) => {
          scanner?.clear();
          setIsScanning(false);
          setScanResult(decodedText);
          
          setIsProcessing(true);
          setError(null);
          
          try {
            const res = await fetch('/api/parse-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: decodedText })
            });
            
            const data = await res.json();
            
            if (res.ok) {
              setProcessResult({
                storeName: data.storeName,
                itemsSaved: data.itemsSaved
              });
            } else {
              setError(data.error || 'Erro ao processar cupom.');
            }
          } catch (err) {
            setError('Falha de conexão com o servidor.');
          } finally {
            setIsProcessing(false);
          }
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
        <h2 style={{ margin: 0 }}>Ler Cupom Fiscal</h2>
      </header>

      <section>
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          
          {!isScanning && !scanResult && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <QrCode size={64} color="var(--text-secondary)" />
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Aponte a câmera para o QR Code do cupom fiscal NFC-e.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsScanning(true)}>
                <Camera size={20} />
                Iniciar Câmera
              </button>
            </>
          )}

          {isScanning && (
            <div id="reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-color-secondary)' }}></div>
          )}

          {isProcessing && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Loader2 size={48} color="var(--accent-color)" className="animate-spin" />
              <p style={{ color: 'var(--accent-color)' }}>Acessando a Secretaria da Fazenda e extraindo preços...</p>
            </div>
          )}

          {processResult && !isProcessing && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle size={48} color="#4ade80" />
              <h3 style={{ color: '#4ade80', marginBottom: '0' }}>Extração Concluída!</h3>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', width: '100%', marginTop: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Loja Identificada:</p>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{processResult.storeName}</p>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}>{processResult.itemsSaved}</strong> novos preços foram gravados no banco Neon!
                </p>
              </div>
              <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => { setScanResult(null); setProcessResult(null); }}>
                Escanear Outro Cupom
              </button>
            </div>
          )}

          {error && !isProcessing && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ color: '#ff4b4b', marginBottom: '0.5rem' }}>Oops!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setScanResult(null); setError(null); }}>
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
