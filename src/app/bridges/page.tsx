'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChainInfo } from '@/components/bridges/ChainInfo';
import { BridgeTransferForm } from '@/components/bridges/BridgeTransferForm';
import { TransactionHistory } from '@/components/bridges/TransactionHistory';
import { useBridges } from '@/hooks/useBridges';
import { useWalletStore } from '@/store/useWalletStore';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError } from '@/utils/errorHandling';

export default function BridgesPage() {
  const { selectedAccount } = useWalletStore();
  const {
    supportedChains,
    transactions,
    balances,
    isLoading,
    error,
    initiateBridgeTransfer,
    estimateBridgeFees,
    refresh
  } = useBridges();

  const [selectedChainId, setSelectedChainId] = useState<string>();

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="px-6">
          <ErrorDisplay
            error={new PolkadotHubError(
              'Wallet not connected',
              'WALLET_NOT_CONNECTED',
              'Please connect your wallet to use the bridge functionality.'
            )}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cross-Chain Bridge</h1>
          <button
            onClick={refresh}
            className="text-pink-600 hover:text-pink-700"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <ErrorDisplay
            error={error}
            action={{
              label: 'Try Again',
              onClick: refresh
            }}
          />
        )}

        <section>
          <h2 className="text-2xl font-semibold mb-4">Available Chains</h2>
          <ChainInfo
            chains={supportedChains}
            balances={balances}
            isLoading={isLoading}
            onSelectChain={setSelectedChainId}
            selectedChainId={selectedChainId}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Bridge Transfer</h2>
          <BridgeTransferForm
            chains={supportedChains}
            balances={balances}
            onTransfer={initiateBridgeTransfer}
            onEstimateFees={estimateBridgeFees}
            isLoading={isLoading}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Transaction History</h2>
          <TransactionHistory
            transactions={transactions}
            chains={supportedChains}
            isLoading={isLoading}
          />
        </section>
      </div>
    </DashboardLayout>
  );
} 