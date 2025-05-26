'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useWalletStore } from '@/store/useWalletStore';
import { NominationPools } from '@/components/staking/NominationPools';
import { ValidatorList } from '@/components/staking/ValidatorList';
import { StakingStats } from '@/components/staking/StakingStats';
import { RewardsHistory } from '@/components/staking/RewardsHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function StakingPage() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadStakingData();
    }
  }, [selectedAccount]);

  const loadStakingData = async () => {
    try {
      setIsLoading(true);
      // Initial data loading if needed
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Please connect your wallet to access staking features.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorDisplay
          error={error}
          action={{
            label: 'Try Again',
            onClick: () => void loadStakingData()
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staking</h1>
          <p className="mt-2 text-gray-600">
            Earn rewards by staking your DOT tokens through nomination pools or direct nomination.
          </p>
        </div>

        <StakingStats address={selectedAccount.address} />

        <div className="mt-8">
          <Tabs defaultValue="pools">
            <TabsList>
              <TabsTrigger value="pools">Nomination Pools</TabsTrigger>
              <TabsTrigger value="validators">Validators</TabsTrigger>
              <TabsTrigger value="rewards">Rewards History</TabsTrigger>
            </TabsList>

            <TabsContent value="pools" className="mt-6">
              <NominationPools />
            </TabsContent>

            <TabsContent value="validators" className="mt-6">
              <ValidatorList />
            </TabsContent>

            <TabsContent value="rewards" className="mt-6">
              <RewardsHistory address={selectedAccount.address} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
} 