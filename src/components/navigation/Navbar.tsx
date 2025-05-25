'use client';

import { WalletConnect } from '@/components/navigation/WalletConnect';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="Polkadot Dashboard"
              />
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/ecosystem"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-pink-600"
              >
                Ecosystem
              </Link>
              <Link
                href="/governance"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-pink-600"
              >
                Governance
              </Link>
              <Link
                href="/staking"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-pink-600"
              >
                Staking
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