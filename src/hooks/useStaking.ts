'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import polkadotApiService from '@/services/polkadotApiService';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface UnlockingEntry {
  value: string;
  era: string;
}

interface StakingData {
  active: string;
  total: string;
  unlocking: UnlockingEntry[];
}

interface AccountStakingInfo {
  balance: string;
  stakingInfo: StakingData | null;
  validators: string[];
}

export function useStaking() {
  const { selectedAccount } = useWalletStore();
  const [stakingInfo, setStakingInfo] = useState<AccountStakingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadStakingInfo();
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
        polkadotApiService.getNominatorInfo(selectedAccount.address),
        polkadotApiService.getValidators()
      ]);

      if (!accountInfo) {
        throw new PolkadotHubError(
          'Failed to load account info',
          ErrorCodes.STAKING.VALIDATOR_ERROR,
          'Could not retrieve staking information for your account'
        );
      }

      const validators = validatorsResult.map(v => v.address);

      const formattedStakingInfo: AccountStakingInfo = {
        balance: await polkadotApiService.getAccountBalance(selectedAccount.address),
        stakingInfo: {
          active: accountInfo.totalStaked,
          total: accountInfo.totalStaked,
          unlocking: accountInfo.unlocking.map(u => ({
            value: u.value,
            era: u.era.toString()
          }))
        },
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
    if (!selectedAccount) {
      throw new PolkadotHubError(
        'Wallet not connected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to start staking'
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new PolkadotHubError(
        'Invalid amount',
        ErrorCodes.VALIDATION.INVALID_AMOUNT,
        'Please enter a valid staking amount'
      );
    }

    if (!validatorId) {
      throw new PolkadotHubError(
        'No validator selected',
        ErrorCodes.VALIDATION.INVALID_TARGET,
        'Please select a validator to stake with'
      );
    }

    try {
      setIsLoading(true);
      setError(null);

      await polkadotApiService.stake(amount, [validatorId]);
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
    if (!selectedAccount) {
      throw new PolkadotHubError(
        'Wallet not connected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to stop staking'
      );
    }

    if (!stakingInfo?.stakingInfo?.active) {
      throw new PolkadotHubError(
        'No active stake found',
        ErrorCodes.DATA.NOT_FOUND,
        'You do not have any active stake to unbond'
      );
    }

    try {
      setIsLoading(true);
      setError(null);

      await polkadotApiService.unstake(stakingInfo.stakingInfo.active);
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