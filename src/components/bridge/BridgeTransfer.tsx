'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { bridgeService, type BridgeProvider, type BridgeQuote } from '@/services/bridgeService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowPathIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface BridgeTransferProps {
  className?: string;
}

export function BridgeTransfer({ className }: BridgeTransferProps) {
  const { selectedAccount } = useWalletStore();
  const [providers, setProviders] = useState<BridgeProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [fromChain, setFromChain] = useState('polkadot');
  const [toChain, setToChain] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProviders();
  }, []);

  useEffect(() => {
    if (fromChain && toChain && amount && selectedProvider) {
      void getQuote();
    }
  }, [fromChain, toChain, amount, selectedProvider]);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bridgeService.getBridgeProviders();
      setProviders(data);
      if (data && data.length > 0) {
        const firstProvider = data[0];
        if (firstProvider?.id) {
          setSelectedProvider(firstProvider.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bridge providers');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuote = async () => {
    if (!fromChain || !toChain || !amount) return;

    try {
      setError(null);
      const quoteData = await bridgeService.getBridgeQuote(fromChain, toChain, amount);
      setQuote(quoteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get bridge quote');
    }
  };

  const handleTransfer = async () => {
    if (!selectedAccount || !fromChain || !toChain || !amount) return;

    try {
      setIsLoading(true);
      setError(null);
      await bridgeService.executeBridgeTransfer(
        fromChain,
        toChain,
        amount,
        selectedAccount.address,
        selectedAccount.address
      );
      // Reset form
      setAmount('');
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bridge Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isLoading}
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - Fee: {provider.fee}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="0.0"
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Chain
            </label>
            <select
              value={fromChain}
              onChange={(e) => setFromChain(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isLoading}
            >
              <option value="polkadot">Polkadot</option>
              <option value="kusama">Kusama</option>
              <option value="asset-hub">Asset Hub</option>
              <option value="astar">Astar</option>
              <option value="moonbeam">Moonbeam</option>
              <option value="acala">Acala</option>
            </select>
          </div>

          <div className="relative flex items-end">
            <Button
              onClick={handleSwapChains}
              className="absolute -left-3 bottom-2 p-1.5 rounded-full bg-white border shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              <ArrowsRightLeftIcon className="h-4 w-4 text-gray-600" />
            </Button>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Chain
              </label>
              <select
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isLoading}
              >
                <option value="">Select chain</option>
                <option value="polkadot">Polkadot</option>
                <option value="kusama">Kusama</option>
                <option value="asset-hub">Asset Hub</option>
                <option value="astar">Astar</option>
                <option value="moonbeam">Moonbeam</option>
                <option value="acala">Acala</option>
              </select>
            </div>
          </div>
        </div>

        {quote && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quote Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium">{quote.amount}</p>
              </div>
              <div>
                <p className="text-gray-500">Fee</p>
                <p className="font-medium">{quote.fee}</p>
              </div>
              <div>
                <p className="text-gray-500">Estimated Time</p>
                <p className="font-medium">{quote.estimatedTime}</p>
              </div>
              <div>
                <p className="text-gray-500">You Receive</p>
                <p className="font-medium">{quote.amount}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          onClick={() => void handleTransfer()}
          className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white"
          disabled={!selectedAccount || !fromChain || !toChain || !amount || isLoading}
        >
          {isLoading ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            'Transfer'
          )}
        </Button>
      </Card>
    </div>
  );
} 