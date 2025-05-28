'use client';
import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import polkadotApiService from '@/services/polkadotApiService';
import type { ValidatorInfo, StakingInfo, NominatorInfo } from '@/types/staking';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ValidatorBrowser } from './ValidatorBrowser';
import { formatBalance } from '@polkadot/util';
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';

export function StakingDashboard() {
  const { selectedAccount } = useWalletStore();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [nominatorInfo, setNominatorInfo] = useState<NominatorInfo | null>(null);
  const [selectedValidators, setSelectedValidators] = useState<ValidatorInfo[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadStakingInfo();
      void loadNominatorInfo();
    }
  }, [selectedAccount]);

  const loadStakingInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await polkadotApiService.getStakingInfo();
      setStakingInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staking info');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNominatorInfo = async () => {
    if (!selectedAccount) return;

    try {
      setIsLoading(true);
      setError(null);
      const info = await polkadotApiService.getNominatorInfo(selectedAccount.address);
      setNominatorInfo(info);
    } catch (err) {
      // Ignore error if user is not a nominator yet
      if (!(err instanceof Error && err.message.includes('not found'))) {
        setError(err instanceof Error ? err.message : 'Failed to load nominator info');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!selectedAccount || !stakeAmount) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // First bond the tokens
      const bondTx = await polkadotApiService.bond(selectedAccount, stakeAmount);
      await bondTx.signAndSend(selectedAccount.address);

      // Then nominate validators if selected
      if (selectedValidators.length > 0) {
        const nominateTx = await polkadotApiService.nominate(
          selectedAccount,
          selectedValidators.map(v => v.address)
        );
        await nominateTx.signAndSend(selectedAccount.address);
      }

      void loadStakingInfo();
      void loadNominatorInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stake');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!selectedAccount || !stakeAmount) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await polkadotApiService.unbond(selectedAccount, stakeAmount);
      await tx.signAndSend(selectedAccount.address);

      void loadStakingInfo();
      void loadNominatorInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstake');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedAccount) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Please connect your wallet to view staking information.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staking Overview */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold">Staking Overview</h2>
          <Button
            variant="outline"
            onClick={() => {
              void loadStakingInfo();
              void loadNominatorInfo();
            }}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Staked</h3>
            <p className="mt-2 text-3xl font-semibold">
              {stakingInfo ? formatBalance(stakingInfo.totalStaked, { withUnit: 'DOT' }) : '-'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Current Era</h3>
            <p className="mt-2 text-3xl font-semibold">
              {stakingInfo?.activeEra || '-'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reward Rate</h3>
            <p className="mt-2 text-3xl font-semibold">
              {stakingInfo ? `${(Number(stakingInfo.rewardRate) / 1e10).toFixed(2)}%` : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Your Staking */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Your Staking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Your Stake</h3>
            <p className="mt-2 text-3xl font-semibold">
              {nominatorInfo ? formatBalance(nominatorInfo.totalStaked, { withUnit: 'DOT' }) : '0 DOT'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Era Rewards</h3>
            <p className="mt-2 text-3xl font-semibold">
              {nominatorInfo ? formatBalance(nominatorInfo.rewards.lastEra, { withUnit: 'DOT' }) : '0 DOT'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Amount to stake/unstake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => void handleStake()} disabled={isLoading || !stakeAmount}>
              Stake
            </Button>
            <Button onClick={() => void handleUnstake()} disabled={isLoading || !stakeAmount} variant="outline">
              Unstake
            </Button>
          </div>

          {nominatorInfo?.unlocking && nominatorInfo.unlocking.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Unstaking in Progress
              </h4>
              <div className="space-y-2">
                {nominatorInfo.unlocking.map((unlock, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{formatBalance(unlock.value, { withUnit: 'DOT' })}</span>
                    <span>Available in Era {unlock.era}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Validator Selection */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Select Validators</h2>
        <ValidatorBrowser
          selectedValidators={selectedValidators}
          onSelect={setSelectedValidators}
          maxSelections={16}
        />
      </div>
    </div>
  );
} 