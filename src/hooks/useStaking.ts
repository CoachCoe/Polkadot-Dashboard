'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { polkadotService } from '@/services/polkadot';
import { PolkadotHubError } from '@/utils/errorHandling';

interface UnlockingEntry {
  value: string;
  era: string;
}

interface StakingData {
  active: string;
  total: string;
  unlocking: UnlockingEntry[];
}

interface StakingInfo {
  balance: string;
  stakingInfo: StakingData | null;
  validators: string[];
}

export function useStaking() {
  const { selectedAccount, signer } = useWalletStore();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      loadStakingInfo();
    } else {
      // Clear staking info when account is disconnected
      setStakingInfo(null);
    }
  }, [selectedAccount]);

  const loadStakingInfo = async () => {
    if (!selectedAccount) {
      setError('No account selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [accountInfo, validatorsResult] = await Promise.all([
        polkadotService.getStakingInfo(selectedAccount.address),
        polkadotService.getValidators()
      ]);

      if (!accountInfo) {
        throw new PolkadotHubError(
          'Failed to load account info',
          'STAKING_ERROR',
          'Could not retrieve staking information for your account'
        );
      }

      const validators = Array.isArray(validatorsResult) 
        ? validatorsResult.map(v => v.toString())
        : [];

      const stakingData = accountInfo.stakingInfo;
      
      const formattedStakingInfo: StakingInfo = {
        balance: accountInfo.balance?.toString() || '0',
        stakingInfo: stakingData ? {
          active: (stakingData.active || '0').toString(),
          total: (stakingData.total || '0').toString(),
          unlocking: Array.isArray(stakingData.unlocking) 
            ? stakingData.unlocking.map(u => ({
                value: u.value?.toString() || '0',
                era: u.era?.toString() || '0'
              }))
            : []
        } : null,
        validators
      };

      setStakingInfo(formattedStakingInfo);
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to load staking information';
      setError(errorMessage);
      console.error('Error loading staking info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startStaking = async (amount: string, validatorId: string) => {
    if (!selectedAccount || !signer) {
      throw new PolkadotHubError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet to start staking'
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new PolkadotHubError(
        'Invalid amount',
        'INVALID_AMOUNT',
        'Please enter a valid staking amount'
      );
    }

    if (!validatorId) {
      throw new PolkadotHubError(
        'No validator selected',
        'INVALID_VALIDATOR',
        'Please select a validator to stake with'
      );
    }

    try {
      setIsLoading(true);
      setError(null);

      await polkadotService.stake(selectedAccount.address, signer, amount, validatorId);
      await loadStakingInfo(); // Refresh staking info after successful stake
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to start staking';
      setError(errorMessage);
      console.error('Error starting staking:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const stopStaking = async () => {
    if (!selectedAccount || !signer) {
      throw new PolkadotHubError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet to stop staking'
      );
    }

    if (!stakingInfo?.stakingInfo?.active) {
      throw new PolkadotHubError(
        'No active stake',
        'NO_STAKE',
        'You do not have any active stake to unstake'
      );
    }

    try {
      setIsLoading(true);
      setError(null);

      await polkadotService.unstake(selectedAccount.address, signer, stakingInfo.stakingInfo.active);
      await loadStakingInfo(); // Refresh staking info after successful unstake
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to stop staking';
      setError(errorMessage);
      console.error('Error stopping staking:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stakingInfo,
    isLoading,
    error,
    startStaking,
    stopStaking,
    refresh: loadStakingInfo
  };
} 