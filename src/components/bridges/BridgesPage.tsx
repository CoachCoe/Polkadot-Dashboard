'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { BridgeTransferForm } from '@/components/bridges/BridgeTransferForm';
import { useWalletStore } from '@/store/useWalletStore';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { bridgesService } from '@/services/bridges';

interface Chain {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  existentialDeposit: string;
  bridgeEnabled: boolean;
  minTransfer?: string;
  maxTransfer?: string;
}

export function BridgesPage() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PolkadotHubError | null>(null);
  const [chains, setChains] = useState<Chain[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadChains = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get supported chains
        const chainsData = bridgesService.getSupportedChains();
        setChains(chainsData);

        // Get balances for each chain
        if (selectedAccount?.address) {
          const address = selectedAccount.address;
          const balancePromises = chainsData.map(async (chain: Chain) => {
            try {
              const balance = await bridgesService.getBalance(address, chain.id);
              // Ensure we always return a string
              return typeof balance === 'string' ? balance : '0';
            } catch (err) {
              console.error(`Failed to get balance for chain ${chain.id}:`, err);
              return '0';
            }
          });
          
          const balanceResults = await Promise.all(balancePromises);
          const balanceMap: Record<string, string> = {};
          
          chainsData.forEach((chain: Chain, index) => {
            const balance = balanceResults[index];
            balanceMap[chain.id] = balance ?? '0';
          });
          
          setBalances(balanceMap);
        }
      } catch (err) {
        setError(
          err instanceof PolkadotHubError
            ? err
            : new PolkadotHubError(
                'Failed to load chain data',
                ErrorCodes.BRIDGE.ERROR,
                'Could not load supported chains and balances.'
              )
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadChains();
  }, [selectedAccount]);

  const handleTransfer = async (amount: string, destination: string) => {
    if (!selectedAccount) {
      throw new PolkadotHubError(
        'Wallet not connected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to make a transfer.'
      );
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Extract chain IDs from the destination address format (this is a simplified example)
      // In a real application, you would need to properly parse the destination address
      // to determine the source and destination chains
      const fromChainId = 'polkadot'; // Example: default to Polkadot as source
      const toChainId = destination.startsWith('ksm') ? 'kusama' : 'astar'; // Example chain detection

      await bridgesService.initiateBridgeTransfer(fromChainId, toChainId, amount, destination);
    } catch (err) {
      throw err instanceof PolkadotHubError
        ? err
        : new PolkadotHubError(
            'Transfer failed',
            ErrorCodes.BRIDGE.ERROR,
            'Failed to complete the transfer. Please try again.'
          );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEstimateFees = async (fromChainId: string, toChainId: string, amount: string) => {
    try {
      return await bridgesService.estimateBridgeFees(fromChainId, toChainId, amount);
    } catch (err) {
      throw err instanceof PolkadotHubError
        ? err
        : new PolkadotHubError(
            'Failed to estimate fees',
            ErrorCodes.BRIDGE.ESTIMATE_ERROR,
            'Unable to calculate transfer fees. Please try again.'
          );
    }
  };

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <ErrorDisplay
            error={new PolkadotHubError(
              'Please connect your wallet to use the bridge.',
              ErrorCodes.WALLET.NOT_CONNECTED,
              'Connect your wallet to transfer tokens between chains.'
            )}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cross-Chain Bridge</h1>
        
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6">
              <ErrorDisplay error={error} />
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-6">
            <BridgeTransferForm
              chains={chains}
              balances={balances}
              onTransfer={handleTransfer}
              onEstimateFees={handleEstimateFees}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 