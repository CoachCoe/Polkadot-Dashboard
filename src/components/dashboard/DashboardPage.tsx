'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { useSession } from 'next-auth/react';
import { usePolkadot } from '@/hooks/usePolkadot';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { AssetManagement } from '@/components/dashboard/AssetManagement';

export const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const { selectedAccount } = usePolkadot();

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
            <h2 className="text-2xl font-bold mb-4">Welcome to Polkadot Hub</h2>
            <p className="text-gray-600">Please sign in to view your dashboard.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Your Polkadot</span>
                  <span className="block text-pink-600">Portfolio</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Track your assets, monitor staking rewards, and manage your cross-chain portfolio all in one place.
                </p>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-pink-500 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          <BalanceCards address={selectedAccount.address} />
          <AssetManagement />
        </div>
      </div>
    </div>
  );
}; 