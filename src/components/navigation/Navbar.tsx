'use client';

import { WalletConnect } from '@/components/wallet/WalletConnect';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/polkadot-logo.svg"
                alt="Polkadot Logo"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold">Polkadot Hub</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/staking" className="text-gray-600 hover:text-gray-900">
                Staking
              </Link>
              <Link href="/governance" className="text-gray-600 hover:text-gray-900">
                Governance
              </Link>
              <Link href="/ecosystem" className="text-gray-600 hover:text-gray-900">
                Ecosystem
              </Link>
            </div>
          </div>

          <WalletConnect />
        </div>
      </div>
    </nav>
  );
} 