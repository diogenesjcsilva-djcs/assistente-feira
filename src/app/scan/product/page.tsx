"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Barcode, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Store {
  id: string;
  name: string;
  address: string;
  distance: number;
  lat?: number;
  lng?: number;
  source?: 'local' | 'google';
}

export default function ProductScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualEan, setManualEan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dados do Formulário
  const [productName, setProductName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [newStoreName, setNewStoreName] = useState('');
  const [price, setPrice] = useState('');
  const [isNewStore, setIsNewStore] = useState(false);
  
  // Geolocation & Lojas
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 120 } },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          scanner?.clear();
          setIsScanning(false);
          handleProductDetected(decodedText);
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

  // Executado ao ler/digitar o EAN
  const handleProductDetected = async (ean: string) => {
    setScanResult(ean);
    setIsProcessing(true);
    setError(null);
    setStatusMsg("Obtendo localização GPS...");

    // 1. Obter GPS (com fallback padrão)
    let coords = { lat: -7.940989, lng: -34.856983 };
    try {
      const gpsCoords: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { timeout: 8000 }
        );
      });
      coords = gpsCoords;
    } catch (gpsErr) {
      console.warn("GPS falhou, usando fallback de Paulista-PE");
    }

    setUserCoords(coords);
    setStatusMsg("Buscando produto nas bases de dados...");

    try {
      // 2. Buscar dados do produto no banco pelo EAN (com fallback no OpenFoodFacts integrado na API)
      const prodRes = await fetch(`/api/products/ean?barcode=${ean}`);
      const prodData = await prodRes.json();
      if (prodRes.ok && prodData.found) {
        setProductName(prodData.product.name);
      } else {
        setProductName('');
      }

      // 3. Buscar lojas próximas pelo GPS (com integração do Google Places na API)
      const storesRes = await fetch(`/api/stores/nearby?lat=${coords.lat}&lng=${coords.lng}`);
      const storesData = await storesRes.json();
      if (storesRes.ok && storesData.stores && storesData.stores.length > 0) {
        setNearbyStores(storesData.stores);
        setSelectedStoreId(storesData.stores[0].id);
        setIsNewStore(false);
      } else {
        setNearbyStores([]);
        setIsNewStore(true); // Se não houver loja, assume que é nova
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados de produto/localização.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEan.trim()) return;
    handleProductDetected(manualEan);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !price || (!selectedStoreId && !newStoreName.trim())) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    setError(null);

    const isGoogle = selectedStoreId.startsWith('google-');
    const selectedStore = nearbyStores.find(s => s.id === selectedStoreId);

    try {
      const res = await fetch('/api/prices/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: scanResult,
          productName,
          storeId: isNewStore ? null : selectedStoreId,
          newStoreName: isNewStore ? newStoreName : null,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          price: parseFloat(price.replace(',', '.')),
          
          // Dados especiais caso seja selecionado um local obtido do Google Maps
          googleStoreName: isGoogle ? selectedStore?.name : null,
          googleStoreAddress: isGoogle ? selectedStore?.address : null,
          googleStoreLat: isGoogle ? selectedStore?.lat : null,
          googleStoreLng: isGoogle ? selectedStore?.lng : null
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao salvar preço.");
      }
    } catch (err) {
      setError("Falha de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setScanResult(null);
    setManualEan('');
    setProductName('');
    setSelectedStoreId('');
    setNewStoreName('');
    setPrice('');
    setIsNewStore(false);
    setSuccess(false);
    setError(null);
  };

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--accent-color)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ margin: 0 }}>Ler Produto</h2>
      </header>

      <section>
        {/* Scanner de Câmera ou Inserção Manual */}
        {!scanResult && !isProcessing && !success && (
          <>
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              {!isScanning ? (
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
              ) : (
                <div id="barcode-reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-color-secondary)' }}></div>
              )}
            </div>

            <div className="glass-card">
              <h3>Inserção Manual</h3>
              <form onSubmit={handleManualSubmit}>
                <div className="input-group">
                  <label>Código de Barras (EAN)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ex: 7891010101010" 
                    value={manualEan}
                    onChange={(e) => setManualEan(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-secondary">Buscar Código</button>
              </form>
            </div>
          </>
        )}

        {/* Loader de GPS/Banco */}
        {isProcessing && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Loader2 size={48} className="animate-spin" color="var(--accent-color)" style={{ margin: '0 auto 1.5rem' }} />
            <p>{statusMsg}</p>
          </div>
        )}

        {/* Formulário de Registro de Preço */}
        {scanResult && !isProcessing && !success && (
          <div className="glass-card animate-fade-in">
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
              Registrar Preço
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              EAN do Produto: <strong style={{ color: '#fff' }}>{scanResult}</strong>
            </p>

            <form onSubmit={handleSavePrice}>
              <div className="input-group">
                <label>Nome do Produto</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nome do produto (ex: Coca-Cola 2L)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Estabelecimento / Supermercado</label>
                
                {!isNewStore ? (
                  <>
                    <select 
                      className="input-field"
                      value={selectedStoreId}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setIsNewStore(true);
                          setSelectedStoreId("");
                        } else {
                          setSelectedStoreId(e.target.value);
                        }
                      }}
                      required
                    >
                      {nearbyStores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} {store.source === 'google' ? '(Google Maps)' : `(${parseFloat((store.distance / 1000).toFixed(2))} km)`}
                        </option>
                      ))}
                      <option value="new">+ Cadastrar Novo Supermercado</option>
                    </select>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Nome do Novo Estabelecimento"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      required
                    />
                    {nearbyStores.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setIsNewStore(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}
                      >
                        ← Escolher Lojas Próximas
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Preço Registrado (R$)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: 5,99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4b4b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={20} /> : "Salvar Preço"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Confirmação de Sucesso */}
        {success && (
          <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle size={64} color="#4ade80" />
            </div>
            <h2>Preço Registrado!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
              O produto e seu preço foram cadastrados com sucesso no Neon.
            </p>
            <button className="btn btn-primary" onClick={resetForm}>
              Escanear Outro Produto
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
