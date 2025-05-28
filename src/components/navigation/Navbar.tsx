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
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/images/logo.svg"
                  alt="Polkadot Hub"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-semibold text-gray-900">Polkadot Dashboard</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/staking" className="text-gray-600 hover:text-gray-900 font-medium">
                Staking
              </Link>
              <Link href="/governance" className="text-gray-600 hover:text-gray-900 font-medium">
                Governance
              </Link>
              <Link href="/ecosystem" className="text-gray-600 hover:text-gray-900 font-medium">
                Ecosystem
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
} 