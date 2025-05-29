'use client';

import { WalletConnect } from '@/components/wallet/WalletConnect';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const basePath = process.env.NODE_ENV === 'production' ? '/Polkadot-Dashboard' : '';

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src={`${basePath}/images/mark-polkadot.svg`}
                  alt="Polkadot"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className={`font-medium ${pathname === '/dashboard' ? 'text-[#E6007A]' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Portfolio Dashboard
              </Link>
              <Link 
                href="/staking" 
                className={`font-medium ${pathname === '/staking' ? 'text-[#E6007A]' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Staking
              </Link>
              <Link 
                href="/governance" 
                className={`font-medium ${pathname === '/governance' ? 'text-[#E6007A]' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Governance
              </Link>
              <Link 
                href="/ecosystem" 
                className={`font-medium ${pathname === '/ecosystem' ? 'text-[#E6007A]' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Ecosystem
              </Link>
              <Link 
                href="/roadmap" 
                className={`font-medium ${pathname === '/roadmap' ? 'text-[#E6007A]' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Product Roadmap
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