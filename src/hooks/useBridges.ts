'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { bridgesService, type ChainInfo, type BridgeTransaction } from '@/services/bridges';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface BridgeState {
  supportedChains: ChainInfo[];
  transactions: BridgeTransaction[];
  balances: Record<string, string>;
}

export function useBridges() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PolkadotHubError | null>(null);
  const [bridgeState, setBridgeState] = useState<BridgeState>({
    supportedChains: [],
    transactions: [],
    balances: {}
  });

  useEffect(() => {
    if (selectedAccount) {
      loadBridgeData();
    }
  }, [selectedAccount]);

  const loadBridgeData = async () => {
    if (!selectedAccount) return;

    try {
      setIsLoading(true);
      setError(null);

      const supportedChains = bridgesService.getSupportedChains();
      
      const [transactions, balances] = await Promise.all([
        bridgesService.getBridgeTransactions(selectedAccount.address),
        Promise.all(
          supportedChains.map(async chain => {
            try {
              const balance = await bridgesService.getBalance(selectedAccount.address, chain.id);
              return { chainId: chain.id, balance };
            } catch (error) {
              console.error(`Failed to fetch balance for ${chain.id}:`, error);
              return { chainId: chain.id, balance: '0' };
            }
          })
        )
      ]);

      setBridgeState({
        supportedChains,
        transactions,
        balances: Object.fromEntries(
          balances.map(({ chainId, balance }) => [chainId, balance])
        )
      });
    } catch (err) {
      const handledError = handleError(err);
      setError(handledError);
      console.error('Failed to load bridge information:', handledError);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateBridgeTransfer = async (
    fromChainId: string,
    toChainId: string,
    amount: string,
    recipient: string
  ) => {
    if (!selectedAccount) {
      throw new PolkadotHubError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet to initiate a bridge transfer.'
      );
    }

    try {
      setIsLoading(true);
      setError(null);

      // Validate chains are different
      if (fromChainId === toChainId) {
        throw new PolkadotHubError(
          'Invalid chain selection',
          ErrorCodes.VALIDATION.INVALID_CHAIN,
          'Source and destination chains must be different.'
        );
      }

      const tx = await bridgesService.initiateBridgeTransfer(
        fromChainId,
        toChainId,
        amount,
        recipient
      );

      // Here you would handle the transaction signing and submission
      console.log('Bridge transfer transaction created:', tx);
      
      // Refresh data after transfer
      await loadBridgeData();
    } catch (err) {
      const handledError = handleError(err);
      setError(handledError);
      throw handledError;
    } finally {
      setIsLoading(false);
    }
  };

  const estimateBridgeFees = async (
    fromChainId: string,
    toChainId: string,
    amount: string
  ) => {
    try {
      if (fromChainId === toChainId) {
        throw new PolkadotHubError(
          'Invalid chain selection',
          ErrorCodes.VALIDATION.INVALID_CHAIN,
          'Source and destination chains must be different.'
        );
      }

      return await bridgesService.estimateBridgeFees(fromChainId, toChainId, amount);
    } catch (err) {
      const handledError = handleError(err);
      setError(handledError);
      throw handledError;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    supportedChains: bridgeState.supportedChains,
    transactions: bridgeState.transactions,
    balances: bridgeState.balances,
    isLoading,
    error,
    initiateBridgeTransfer,
    estimateBridgeFees,
    refresh: loadBridgeData,
    clearError
  };
} 