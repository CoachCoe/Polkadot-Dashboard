'use client';

import React, { memo } from 'react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/constants';

const NavLink = memo(({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => (
  <Link 
    href={href} 
    className={`font-medium ${isActive ? 'text-[#E6007A]' : 'text-gray-600 hover:text-gray-900'}`}
  >
    {label}
  </Link>
));
NavLink.displayName = 'NavLink';

export const Navbar = memo(function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href={ROUTES.HOME} className="flex items-center space-x-3">
              <div className="relative w-8 h-8 bg-gray-100 rounded-full">
                <Image
                  src="/images/mark-polkadot.svg"
                  alt="Polkadot"
                  fill
                  className="object-contain"
                  priority
                  loading="eager"
                  sizes="32px"
                />
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href={ROUTES.DASHBOARD} label="Portfolio Dashboard" isActive={pathname === ROUTES.DASHBOARD} />
              <NavLink href={ROUTES.STAKING} label="Staking" isActive={pathname === ROUTES.STAKING} />
              <NavLink href={ROUTES.GOVERNANCE} label="Governance" isActive={pathname === ROUTES.GOVERNANCE} />
              <NavLink href={ROUTES.ECOSYSTEM} label="Ecosystem" isActive={pathname === ROUTES.ECOSYSTEM} />
              <NavLink href={ROUTES.RELIABILITY_METRICS} label="Reliability Metrics" isActive={pathname === ROUTES.RELIABILITY_METRICS} />
              <NavLink href={ROUTES.ROADMAP} label="Product Roadmap" isActive={pathname === ROUTES.ROADMAP} />
            </div>
          </div>

          <div className="flex items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}); 