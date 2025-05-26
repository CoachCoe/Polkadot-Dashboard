'use client';

import { WalletConnect } from '@/components/navigation/WalletConnect';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image
                src="/polkadot-logo.svg"
                alt="Polkadot"
                width={32}
                height={32}
                priority
              />
              <span className="text-xl font-bold text-[#E6007A]">Dashboard</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/ecosystem"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-[#E6007A]"
              >
                Ecosystem
              </Link>
              <Link
                href="/governance"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-[#E6007A]"
              >
                Governance
              </Link>
              <Link
                href="/staking"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-[#E6007A]"
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