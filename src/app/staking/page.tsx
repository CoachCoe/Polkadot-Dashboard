'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useStaking } from '@/hooks/useStaking';
import { useWalletStore } from '@/store/useWalletStore';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError } from '@/utils/errorHandling';

export default function StakingPage() {
  const { selectedAccount } = useWalletStore();
  const { 
    stakingInfo, 
    isLoading, 
    error,
    startStaking,
    stopStaking,
    refresh
  } = useStaking();

  const [amount, setAmount] = useState('');
  const [selectedValidator, setSelectedValidator] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="px-6">
          <ErrorDisplay
            error={new PolkadotHubError(
              'Please connect your wallet to view staking information.',
              'WALLET_NOT_CONNECTED'
            )}
          />
        </div>
      </DashboardLayout>
    );
  }

  const handleStartStaking = async () => {
    try {
      setIsStaking(true);
      await startStaking(amount, selectedValidator);
      setAmount('');
      setSelectedValidator('');
    } catch (err) {
      console.error('Failed to start staking:', err);
    } finally {
      setIsStaking(false);
    }
  };

  const handleStopStaking = async () => {
    try {
      setIsStaking(true);
      await stopStaking();
    } catch (err) {
      console.error('Failed to stop staking:', err);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Staking</h1>
          <button
            onClick={refresh}
            className="text-pink-600 hover:text-pink-700"
            disabled={isLoading || isStaking}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {error && (
          <ErrorDisplay
            error={new PolkadotHubError(
              error,
              'STAKING_ERROR',
              'Failed to load staking information. Please try again.'
            )}
            action={{
              label: 'Try Again',
              onClick: refresh
            }}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staking Overview Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Staking Overview</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Balance</span>
                  <span className="font-medium">
                    {stakingInfo?.balance || '0'} DOT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Stake</span>
                  <span className="font-medium">
                    {stakingInfo?.stakingInfo?.active || '0'} DOT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Stake</span>
                  <span className="font-medium">
                    {stakingInfo?.stakingInfo?.total || '0'} DOT
                  </span>
                </div>
                {stakingInfo?.stakingInfo?.unlocking && stakingInfo.stakingInfo.unlocking.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Unlocking</h3>
                    <div className="space-y-2">
                      {stakingInfo.stakingInfo.unlocking.map((chunk, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">Era {chunk.era}</span>
                          <span>{chunk.value} DOT</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staking Actions Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Staking Actions</h2>
            <div className="space-y-4">
              {stakingInfo?.stakingInfo ? (
                <>
                  <p className="text-sm text-gray-600">
                    You are currently staking. You can stop staking to withdraw your funds.
                  </p>
                  <button 
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    onClick={handleStopStaking}
                    disabled={isLoading || isStaking}
                  >
                    {isStaking ? 'Processing...' : 'Stop Staking'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (DOT)
                    </label>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter amount to stake"
                      disabled={isLoading || isStaking}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Validator
                    </label>
                    <select
                      value={selectedValidator}
                      onChange={(e) => setSelectedValidator(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={isLoading || isStaking}
                    >
                      <option value="">Select a validator</option>
                      {stakingInfo?.validators.map((validator) => (
                        <option key={validator} value={validator}>
                          {validator}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                    onClick={handleStartStaking}
                    disabled={isLoading || isStaking || !amount || !selectedValidator}
                  >
                    {isStaking ? 'Processing...' : 'Start Staking'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 