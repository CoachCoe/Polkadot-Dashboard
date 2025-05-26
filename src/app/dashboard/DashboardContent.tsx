'use client';

import { useWalletStore } from '@/store/useWalletStore';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { MultiChainBalances } from '@/components/dashboard/MultiChainBalances';
import { AssetManagement } from '@/components/dashboard/AssetManagement';
import { Card } from '@/components/ui/Card';
import { WalletConnect } from '@/components/wallet/WalletConnect';

export function DashboardContent() {
  const { selectedAccount } = useWalletStore();

  if (!selectedAccount) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to Polkadot Hub</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to view your portfolio and manage your assets.</p>
          <WalletConnect />
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <PortfolioOverview />
        <MultiChainBalances />
        <AssetManagement />
      </div>
    </div>
  );
} 