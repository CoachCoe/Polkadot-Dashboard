'use client';

import React from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Card } from '@/components/ui/Card';
import { HomeOverview } from '@/components/dashboard/HomeOverview';

export function DashboardContent() {
  const { selectedAccount } = useWalletStore();

  if (!selectedAccount) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to Polkadot Hub</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to view your home dashboard and manage your assets.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <HomeOverview address={selectedAccount.address} />
    </div>
  );
} 