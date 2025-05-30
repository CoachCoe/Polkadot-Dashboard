'use client';
import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import polkadotApiService from '@/services/polkadotApiService';
import type { ValidatorInfo, StakingInfo, NominatorInfo } from '@/types/staking';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBalance } from '@polkadot/util';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

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

      await web3Enable('Polkadot Dashboard');
      const injector = await web3FromAddress(selectedAccount.address);
      
      // First bond the tokens
      const bondTx = await polkadotApiService.bond(selectedAccount, stakeAmount);
      await bondTx.signAndSend(selectedAccount.address, { signer: injector.signer });

      // Then nominate validators if selected
      if (selectedValidators.length > 0) {
        const nominateTx = await polkadotApiService.nominate(
          selectedValidators.map(v => v.address)
        );
        await nominateTx.signAndSend(selectedAccount.address, { signer: injector.signer });
      }

      void loadStakingInfo();
      void loadNominatorInfo();
      setStakeAmount('');
      setSelectedValidators([]);
    } catch (err) {
      console.error('Failed to stake:', err);
      setError(err instanceof Error ? err.message : 'Failed to stake tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbond = async () => {
    if (!selectedAccount || !stakeAmount) return;

    try {
      setIsLoading(true);
      setError(null);

      await web3Enable('Polkadot Dashboard');
      const injector = await web3FromAddress(selectedAccount.address);
      
      const unbondTx = await polkadotApiService.unbond(stakeAmount);
      await unbondTx.signAndSend(selectedAccount.address, { signer: injector.signer });

      void loadStakingInfo();
      void loadNominatorInfo();
      setStakeAmount('');
    } catch (err) {
      console.error('Failed to unbond:', err);
      setError(err instanceof Error ? err.message : 'Failed to unbond tokens');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900">Connect Your Wallet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please connect your wallet to start staking and earning rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Staking Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-white shadow-lg rounded-xl border-0 transform transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Total Staked</h3>
            <Button
              variant="ghost"
              onClick={() => {
                void loadStakingInfo();
                void loadNominatorInfo();
              }}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stakingInfo ? formatBalance(stakingInfo.totalStaked, { withUnit: 'DOT' }) : '-'}
          </p>
          <p className="mt-2 text-sm text-gray-500">Across the network</p>
        </Card>

        <Card className="p-6 bg-white shadow-lg rounded-xl border-0 transform transition-all duration-200 hover:shadow-xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Stake</h3>
          <p className="text-3xl font-bold text-gray-900">
            {nominatorInfo ? formatBalance(nominatorInfo.totalStaked, { withUnit: 'DOT' }) : '0 DOT'}
          </p>
          <p className="mt-2 text-sm text-gray-500">Your contribution</p>
        </Card>

        <Card className="p-6 bg-white shadow-lg rounded-xl border-0 transform transition-all duration-200 hover:shadow-xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Era</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stakingInfo?.activeEra || '-'}
          </p>
          <p className="mt-2 text-sm text-gray-500">Active staking period</p>
        </Card>
      </div>

      {/* Staking Actions */}
      <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Staking Actions</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Amount to stake/unstake"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={handleStake} 
                disabled={isLoading || !stakeAmount}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
              >
                Stake
              </Button>
              <Button 
                onClick={handleUnbond} 
                disabled={isLoading || !stakeAmount}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Unstake
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 