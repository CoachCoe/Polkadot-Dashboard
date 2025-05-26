'use client';
import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/hooks/usePolkadot';
import { ValidatorInfo, StakingInfo } from '@/services/polkadotApiService';
import { formatBalance } from '@polkadot/util';

const StakingDashboard: React.FC = () => {
  const {
    isConnected,
    isWalletConnected,
    selectedAccount,
    error,
    connectWallet,
    getBalance,
    getStakingInfo,
    getValidators,
    stake,
    unstake,
    withdrawUnbonded
  } = usePolkadot();

  const [balance, setBalance] = useState<string>('0');
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isConnected && selectedAccount) {
        setLoading(true);
        try {
          const [accountBalance, accountStakingInfo, availableValidators] = await Promise.all([
            getBalance(selectedAccount.address),
            getStakingInfo(selectedAccount.address),
            getValidators()
          ]);

          setBalance(accountBalance);
          setStakingInfo(accountStakingInfo);
          setValidators(availableValidators);
        } catch (err) {
          console.error('Error fetching staking data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isConnected, selectedAccount, getBalance, getStakingInfo, getValidators]);

  const handleStake = async () => {
    if (!stakeAmount || selectedValidators.length === 0) return;

    setLoading(true);
    try {
      await stake(stakeAmount, selectedValidators);
      // Refresh data after staking
      if (selectedAccount) {
        const [newBalance, newStakingInfo] = await Promise.all([
          getBalance(selectedAccount.address),
          getStakingInfo(selectedAccount.address)
        ]);
        setBalance(newBalance);
        setStakingInfo(newStakingInfo);
      }
      setStakeAmount('');
      setSelectedValidators([]);
    } catch (err) {
      console.error('Error staking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;

    setLoading(true);
    try {
      await unstake(unstakeAmount);
      // Refresh data after unstaking
      if (selectedAccount) {
        const [newBalance, newStakingInfo] = await Promise.all([
          getBalance(selectedAccount.address),
          getStakingInfo(selectedAccount.address)
        ]);
        setBalance(newBalance);
        setStakingInfo(newStakingInfo);
      }
      setUnstakeAmount('');
    } catch (err) {
      console.error('Error unstaking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await withdrawUnbonded();
      // Refresh data after withdrawal
      if (selectedAccount) {
        const [newBalance, newStakingInfo] = await Promise.all([
          getBalance(selectedAccount.address),
          getStakingInfo(selectedAccount.address)
        ]);
        setBalance(newBalance);
        setStakingInfo(newStakingInfo);
      }
    } catch (err) {
      console.error('Error withdrawing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4">
        <div className="text-red-500">Not connected to Polkadot network</div>
      </div>
    );
  }

  if (!isWalletConnected) {
    return (
      <div className="p-4">
        <button
          onClick={connectWallet}
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Available Balance</p>
            <p className="text-xl font-semibold">{formatBalance(balance)}</p>
          </div>
          {stakingInfo && (
            <div>
              <p className="text-gray-600">Staked Amount</p>
              <p className="text-xl font-semibold">{formatBalance(stakingInfo.active)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Staking</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount to Stake</label>
            <input
              type="text"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Validators</label>
            <div className="mt-1 max-h-60 overflow-y-auto">
              {validators.map((validator) => (
                <div key={validator.address} className="flex items-center space-x-2 p-2">
                  <input
                    type="checkbox"
                    checked={selectedValidators.includes(validator.address)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedValidators([...selectedValidators, validator.address]);
                      } else {
                        setSelectedValidators(selectedValidators.filter(v => v !== validator.address));
                      }
                    }}
                    className="rounded text-pink-500 focus:ring-pink-500"
                  />
                  <div>
                    <p className="font-medium">
                      {validator.identity?.display || validator.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      Commission: {validator.commission}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStake}
            disabled={!stakeAmount || selectedValidators.length === 0}
            className="w-full bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors disabled:bg-gray-300"
          >
            Stake
          </button>
        </div>
      </div>

      {stakingInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Unstaking</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount to Unstake</label>
              <input
                type="text"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                placeholder="Enter amount"
              />
            </div>

            <button
              onClick={handleUnstake}
              disabled={!unstakeAmount}
              className="w-full bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors disabled:bg-gray-300"
            >
              Unstake
            </button>

            {stakingInfo.unlocking.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlocking</h3>
                <div className="space-y-2">
                  {stakingInfo.unlocking.map((chunk, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{formatBalance(chunk.value)}</span>
                      <span>Era {chunk.era}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleWithdraw}
                  className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Withdraw Unbonded
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingDashboard; 