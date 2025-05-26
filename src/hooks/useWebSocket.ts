'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { websocketService } from '@/services/websocketService';

interface WebSocketHookProps {
  onBalanceChange?: (balance: string) => void;
  onValidatorUpdate?: (validators: string[]) => void;
  onReferendumUpdate?: (referenda: any[]) => void;
  onBlockUpdate?: (block: any) => void;
}

export function useWebSocket({
  onBalanceChange,
  onValidatorUpdate,
  onReferendumUpdate,
  onBlockUpdate
}: WebSocketHookProps = {}) {
  const { selectedAccount } = useWalletStore();

  useEffect(() => {
    let unsubscribeBalance: (() => void) | undefined;
    let unsubscribeValidators: (() => void) | undefined;
    let unsubscribeReferenda: (() => void) | undefined;
    let unsubscribeBlocks: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        // Connect to WebSocket if not already connected
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }

        // Subscribe to balance updates if callback provided and account selected
        if (onBalanceChange && selectedAccount) {
          unsubscribeBalance = await websocketService.subscribeToBalanceChanges(
            selectedAccount.address,
            onBalanceChange
          );
        }

        // Subscribe to validator updates if callback provided
        if (onValidatorUpdate) {
          unsubscribeValidators = await websocketService.subscribeToValidatorUpdates(
            onValidatorUpdate
          );
        }

        // Subscribe to referendum updates if callback provided
        if (onReferendumUpdate) {
          unsubscribeReferenda = await websocketService.subscribeToReferendumUpdates(
            onReferendumUpdate
          );
        }

        // Subscribe to block updates if callback provided
        if (onBlockUpdate) {
          unsubscribeBlocks = await websocketService.subscribeToBlockUpdates(
            onBlockUpdate
          );
        }
      } catch (error) {
        console.error('Failed to setup WebSocket subscriptions:', error);
      }
    };

    void setupSubscriptions();

    // Cleanup subscriptions on unmount or when dependencies change
    return () => {
      if (unsubscribeBalance) unsubscribeBalance();
      if (unsubscribeValidators) unsubscribeValidators();
      if (unsubscribeReferenda) unsubscribeReferenda();
      if (unsubscribeBlocks) unsubscribeBlocks();
    };
  }, [selectedAccount, onBalanceChange, onValidatorUpdate, onReferendumUpdate, onBlockUpdate]);
} 