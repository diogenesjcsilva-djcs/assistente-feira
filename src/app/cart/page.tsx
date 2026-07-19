"use client";

import { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Plus, 
  Minus, 
  Trash2, 
  Barcode, 
  Camera, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
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

interface CartItem {
  id: string; // EAN
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export default function CartPDV() {
  const [store, setStore] = useState<Store | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  
  // Modais e Adição de Item
  const [showAddModal, setShowAddModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [processingBarcode, setProcessingBarcode] = useState(false);
  const [productName, setProductName] = useState('');
  const [productQty, setProductQty] = useState('1');
  const [productPrice, setProductPrice] = useState('');
  
  // Status de gravação externa
  const [scannedEan, setScannedEan] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // 1. Carrega dados do Carrinho e Loja salvos
  useEffect(() => {
    const savedCart = localStorage.getItem('pdv_cart');
    const savedStore = localStorage.getItem('pdv_store');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
    
    if (savedStore) {
      try {
        setStore(JSON.parse(savedStore));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Salva itens do carrinho localmente
  const updateCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('pdv_cart', JSON.stringify(items));
  };

  // 2. Fluxo de Geolocalização para escolher o Mercado Atual
  const handleDetectLocation = async () => {
    setLoadingGPS(true);
    setGpsError(null);

    let coords = { lat: -7.940989, lng: -34.856983 }; // Fallback
    try {
      const gpsCoords: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { timeout: 8000 }
        );
      });
      coords = gpsCoords;
    } catch (err) {
      console.warn("GPS falhou, usando fallback de Paulista-PE.");
      setGpsError("GPS não disponível. Exibindo lojas em Paulista-PE.");
    }

    try {
      const res = await fetch(`/api/stores/nearby?lat=${coords.lat}&lng=${coords.lng}`);
      const data = await res.json();
      if (res.ok && data.stores && data.stores.length > 0) {
        setNearbyStores(data.stores);
      } else {
        setNearbyStores([]);
      }
    } catch (err) {
      console.error(err);
      setGpsError("Erro ao consultar lojas no servidor.");
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleSelectStore = (selectedStore: Store) => {
    setStore(selectedStore);
    localStorage.setItem('pdv_store', JSON.stringify(selectedStore));
    setNearbyStores([]);
  };

  const handleClearStore = () => {
    setStore(null);
    localStorage.removeItem('pdv_store');
    updateCart([]); // Limpa o carrinho ao trocar de mercado
  };

  // 3. Scanner dentro do Modal de Adição
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScanning && showAddModal) {
      scanner = new Html5QrcodeScanner(
        "cart-barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 120 } },
        /* verbose= */ false
      );
      
      scanner.render(
        async (decodedText) => {
          console.log("[Scanner] Código de barras lido:", decodedText);
          try {
            await scanner?.clear();
          } catch (e) {
            console.warn("[Scanner] Erro ao limpar instância do scanner:", e);
          }
          setIsScanning(false);
          handleBarcodeDetected(decodedText);
        },
        (err) => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isScanning, showAddModal]);

  // Executado ao ler ou inserir EAN no modal
  const handleBarcodeDetected = async (ean: string) => {
    const cleanEan = ean.trim();
    console.log("[PDV] Processando EAN detectado:", cleanEan);

    setScannedEan(cleanEan);
    setProcessingBarcode(true);
    setDbError(null);
    setProductName('');
    setProductPrice('');

    try {
      const url = `/api/products/ean?barcode=${cleanEan}`;
      console.log("[PDV] Consultando API:", url);
      const res = await fetch(url);
      const data = await res.json();
      console.log("[PDV] Resposta recebida da API de EAN:", data);
      
      if (res.ok && data.found && data.product) {
        console.log("[PDV] Produto encontrado e definido no input:", data.product.name);
        setProductName(data.product.name);
      } else {
        console.log("[PDV] Produto não encontrado no banco ou OpenFoodFacts.");
      }
    } catch (err) {
      console.error("[PDV] Falha na requisição da API de EAN:", err);
      setDbError("Erro ao buscar dados do produto na base.");
    } finally {
      console.log("[PDV] Concluindo carregamento da sub-tela.");
      setProcessingBarcode(false);
    }
  };

  // Adiciona item ao carrinho e salva preço no banco
  const handleAddItemToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedEan || !productName.trim() || !productPrice || !store) return;

    setSavingItem(true);
    setDbError(null);

    const priceNum = parseFloat(productPrice.replace(',', '.'));
    const qtyNum = parseFloat(productQty);

    try {
      // 1. Envia o preço ao Neon silenciosamente para alimentar o banco
      const isGoogle = store.id.startsWith('google-');
      await fetch('/api/prices/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: scannedEan,
          productName,
          storeId: isGoogle ? null : parseInt(store.id),
          newStoreName: isGoogle ? store.name : null,
          lat: store.lat || -7.940989,
          lng: store.lng || -34.856983,
          price: priceNum,
          googleStoreName: isGoogle ? store.name : null,
          googleStoreAddress: isGoogle ? store.address : null,
          googleStoreLat: isGoogle ? store.lat : null,
          googleStoreLng: isGoogle ? store.lng : null
        })
      });

      // 2. Adiciona/Atualiza no Carrinho Local
      const existingIndex = cartItems.findIndex(item => item.id === scannedEan);
      let newItems = [...cartItems];

      if (existingIndex > -1) {
        const existingItem = newItems[existingIndex];
        const newQty = existingItem.qty + qtyNum;
        newItems[existingIndex] = {
          ...existingItem,
          qty: newQty,
          unitPrice: priceNum,
          subtotal: parseFloat((newQty * priceNum).toFixed(2))
        };
      } else {
        newItems.push({
          id: scannedEan,
          name: productName,
          qty: qtyNum,
          unitPrice: priceNum,
          subtotal: parseFloat((qtyNum * priceNum).toFixed(2))
        });
      }

      updateCart(newItems);
      closeAddModal();
    } catch (err) {
      console.error(err);
      setDbError("Preço adicionado localmente, mas falhou ao enviar ao banco.");
    } finally {
      setSavingItem(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setIsScanning(false);
    setScannedEan(null);
    setBarcodeInput('');
    setProductName('');
    setProductQty('1');
    setProductPrice('');
    setDbError(null);
  };

  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const newItems = cartItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          qty: newQty,
          subtotal: parseFloat((newQty * item.unitPrice).toFixed(2))
        };
      }
      return item;
    });
    updateCart(newItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = cartItems.filter(item => item.id !== itemId);
    updateCart(newItems);
  };

  const handleClearCart = () => {
    if (confirm("Deseja realmente esvaziar o carrinho?")) {
      updateCart([]);
    }
  };

  const totalCartValue = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: '180px' }}>
      <header className="app-header" style={{ paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Carrinho / PDV</h2>
        {store && (
          <button 
            onClick={handleClearStore}
            style={{ background: 'transparent', border: 'none', color: '#ff4b4b', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Trocar Loja
          </button>
        )}
      </header>

      {/* ETAPA 1: SELECIONAR MERCADO */}
      {!store && (
        <section style={{ marginTop: '2rem' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <MapPin size={48} color="var(--accent-color)" style={{ margin: '0 auto 1.5rem' }} />
            <h3>Onde você está comprando?</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
              Para calcularmos sua conta e salvarmos os preços corretos, selecione o supermercado atual.
            </p>

            {nearbyStores.length === 0 && !loadingGPS && (
              <button onClick={handleDetectLocation} className="btn btn-primary" style={{ margin: '0 auto' }}>
                Localizar Supermercados
              </button>
            )}

            {loadingGPS && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Obtendo GPS e buscando lojas...</p>
              </div>
            )}

            {gpsError && !loadingGPS && nearbyStores.length === 0 && (
              <p style={{ color: '#ffc107', fontSize: '0.85rem', marginTop: '1rem' }}>{gpsError}</p>
            )}

            {nearbyStores.length > 0 && (
              <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Selecione um local próximo:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {nearbyStores.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => handleSelectStore(s)}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'border-color 0.2s',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <h4 style={{ margin: 0 }}>{s.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {s.source === 'google' ? 'Google Maps' : `${parseFloat((s.distance / 1000).toFixed(2))} km de distância`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ETAPA 2: LISTA DE COMPRAS NO CARRINHO */}
      {store && (
        <section>
          {/* Loja Atual */}
          <div className="glass-card" style={{ padding: '0.8rem 1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderColor: 'rgba(102, 252, 241, 0.2)' }}>
            <ShoppingBag size={20} color="var(--accent-color)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Estabelecimento Atual</p>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{store.name}</h4>
            </div>
          </div>

          {/* Botão de Adição Reposicionado no Topo */}
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary" 
            style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}
          >
            <Barcode size={20} />
            Bipar / Adicionar Item
          </button>

          {/* Carrinho Vazio */}
          {cartItems.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <ShoppingBag size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
              <h3>Carrinho Vazio</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Clique no botão acima para começar a bipar e somar seus itens!
              </p>
            </div>
          ) : (
            /* Lista de Itens no Carrinho (Responsiva para Mobile) */
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Itens no Carrinho</span>
                <button onClick={handleClearCart} style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Esvaziar
                </button>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {cartItems.map(item => (
                  <li key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                    {/* Linha Superior: Nome do Produto e Remover */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500, lineHeight: '1.3', color: '#fff' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EAN: {item.id}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Linha Inferior: Controles de Quantidade, Preço Unitário e Subtotal */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {/* Qtd */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem' }}>
                        <button 
                          onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.3rem' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 'bold', width: '28px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.3rem' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Preço Unitário e Totalizador por item */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.qty} x R$ {item.unitPrice.toFixed(2).replace('.', ',')} =
                        </span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-color)' }}>
                          R$ {item.subtotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Painel Totalizador Fixo */}
          <div style={{
            position: 'fixed',
            bottom: '72px', 
            left: 0,
            right: 0,
            backgroundColor: 'rgba(23, 37, 42, 0.95)',
            borderTop: '1px solid var(--card-border)',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            zIndex: 100
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total do Carrinho</span>
              <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                R$ {totalCartValue.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
              <strong>{cartItems.reduce((acc, i) => acc + i.qty, 0)}</strong> itens
            </div>
          </div>
        </section>
      )}

      {/* MODAL DE ADICIONAR ITEM */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
              Adicionar ao Carrinho
            </h3>

            {/* Sub-tela 1: Ler Barcode */}
            {!scannedEan && !processingBarcode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  {isScanning ? (
                    <div id="cart-barcode-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-color-secondary)' }}></div>
                  ) : (
                    <>
                      <Barcode size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
                      <button type="button" onClick={() => setIsScanning(true)} className="btn btn-secondary">
                        <Camera size={18} />
                        Bipar Código
                      </button>
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <form onSubmit={(e) => { e.preventDefault(); if (barcodeInput.trim()) handleBarcodeDetected(barcodeInput); }}>
                    <div className="input-group">
                      <label>Inserir Código de Barras Manual</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Ex: 7891010101010" 
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary">Carregar Produto</button>
                  </form>
                </div>
              </div>
            )}

            {/* Sub-tela 2: Carregando EAN */}
            {processingBarcode && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 size={32} className="animate-spin" color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Identificando produto...</p>
              </div>
            )}

            {/* Sub-tela 3: Formulário de Qtd/Preço */}
            {scannedEan && !processingBarcode && (
              <form onSubmit={handleAddItemToCart}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  EAN do Produto: <strong>{scannedEan}</strong>
                </p>

                <div className="input-group">
                  <label>Nome do Produto</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nome do produto"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Quantidade</label>
                    <input 
                      type="number" 
                      className="input-field"
                      value={productQty}
                      onChange={(e) => setProductQty(e.target.value)}
                      min="1"
                      step="any"
                      required
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1.5 }}>
                    <label>Preço Unitário (R$)</label>
                    <input 
                      type="text" 
                      className="input-field"
                      placeholder="Ex: 5,99"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {dbError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffc107', fontSize: '0.8rem', margin: '1rem 0' }}>
                    <AlertCircle size={14} />
                    <span>{dbError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={closeAddModal} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingItem} className="btn btn-primary">
                    {savingItem ? <Loader2 size={16} className="animate-spin" /> : "Adicionar"}
                  </button>
                </div>
              </form>
            )}

            {!scannedEan && (
              <button type="button" onClick={closeAddModal} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
