'use client';

import React, { memo } from 'react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import Link from 'next/link';
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
              <div className="relative w-8 h-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1340 1410.3" className="w-full h-full">
                  <ellipse className="fill-[#E6007A]" cx="663" cy="147.9" rx="254.3" ry="147.9"/>
                  <ellipse className="fill-[#E6007A]" cx="663" cy="1262.3" rx="254.3" ry="147.9"/>
                  <ellipse transform="matrix(0.5 -0.866 0.866 0.5 -279.1512 369.5916)" className="fill-[#E6007A]" cx="180.5" cy="426.5" rx="254.3" ry="148"/>
                  <ellipse transform="matrix(0.5 -0.866 0.866 0.5 -279.1552 1483.9517)" className="fill-[#E6007A]" cx="1145.6" cy="983.7" rx="254.3" ry="147.9"/>
                  <ellipse transform="matrix(0.866 -0.5 0.5 0.866 -467.6798 222.044)" className="fill-[#E6007A]" cx="180.5" cy="983.7" rx="148" ry="254.3"/>
                  <ellipse transform="matrix(0.866 -0.5 0.5 0.866 -59.8007 629.9254)" className="fill-[#E6007A]" cx="1145.6" cy="426.6" rx="147.9" ry="254.3"/>
                </svg>
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