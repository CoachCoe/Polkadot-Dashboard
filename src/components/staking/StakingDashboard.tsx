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
      <Card className="p-6">
        <p className="text-gray-500">Please connect your wallet to start staking.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staking Overview */}
      <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Staking Overview</h2>
          <Button
            variant="outline"
            onClick={() => {
              void loadStakingInfo();
              void loadNominatorInfo();
            }}
            disabled={isLoading}
            className="text-gray-700 hover:text-gray-900"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Staked</h3>
            <p className="text-3xl font-bold text-gray-900">
              {stakingInfo ? formatBalance(stakingInfo.totalStaked, { withUnit: 'DOT' }) : '-'}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Current Era</h3>
            <p className="text-3xl font-bold text-gray-900">
              {stakingInfo?.activeEra || '-'}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Reward Rate</h3>
            <p className="text-3xl font-bold text-gray-900">
              {stakingInfo ? `${(Number(stakingInfo.rewardRate) / 1e10).toFixed(2)}%` : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Your Staking */}
      <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Your Staking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Your Stake</h3>
            <p className="text-3xl font-bold text-gray-900">
              {nominatorInfo ? formatBalance(nominatorInfo.totalStaked, { withUnit: 'DOT' }) : '0 DOT'}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Last Era Rewards</h3>
            <p className="text-3xl font-bold text-gray-900">
              {nominatorInfo ? formatBalance(nominatorInfo.rewards.lastEra, { withUnit: 'DOT' }) : '0 DOT'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Amount to stake/unstake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => void handleStake()} 
              disabled={isLoading || !stakeAmount}
              className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white"
            >
              Stake
            </Button>
            <Button 
              onClick={() => void handleUnbond()} 
              disabled={isLoading || !stakeAmount} 
              variant="outline"
              className="border-polkadot-pink text-polkadot-pink hover:bg-polkadot-pink hover:text-white"
            >
              Unbond
            </Button>
          </div>

          {nominatorInfo?.unlocking && nominatorInfo.unlocking.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
                Unstaking in Progress
              </h4>
              <div className="space-y-3">
                {nominatorInfo.unlocking.map((unlock, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-gray-900">{formatBalance(unlock.value, { withUnit: 'DOT' })}</span>
                    <span className="text-gray-500">Available in Era {unlock.era}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Validator Selection */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Validators</h2>
        <ValidatorBrowser
          selectedValidators={selectedValidators}
          onSelect={setSelectedValidators}
          maxSelections={16}
        />
      </div>
    </div>
  );
} 