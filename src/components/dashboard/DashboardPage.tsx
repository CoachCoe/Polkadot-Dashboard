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
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome to Polkadot Hub</h2>
        <p className="text-gray-600">Please sign in to view your dashboard.</p>
      </Card>
    );
  }

  if (!selectedAccount) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BalanceCards address={selectedAccount.address} />
      <AssetManagement />
    </div>
  );
}; 