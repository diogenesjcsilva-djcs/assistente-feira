"use client";

import Link from 'next/link';
import { Home, ScanLine, ShoppingCart, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Início</span>
      </Link>
      <Link href="/scan" className={`nav-item ${pathname?.startsWith('/scan') ? 'active' : ''}`}>
        <ScanLine size={24} />
        <span>Escanear</span>
      </Link>
      <Link href="/list" className={`nav-item ${pathname === '/list' ? 'active' : ''}`}>
        <ShoppingCart size={24} />
        <span>Lista</span>
      </Link>
      <Link href="/map" className={`nav-item ${pathname === '/map' ? 'active' : ''}`}>
        <MapPin size={24} />
        <span>Lojas</span>
      </Link>
    </nav>
  );
}
