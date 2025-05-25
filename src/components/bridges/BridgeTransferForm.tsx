'use client';

import React, { useState, useEffect } from 'react';
import { ChainInfo } from '@/services/bridges';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError } from '@/utils/errorHandling';

interface BridgeTransferFormProps {
  chains: ChainInfo[];
  balances: Record<string, string>;
  onTransfer: (fromChainId: string, toChainId: string, amount: string, recipient: string) => Promise<void>;
  onEstimateFees: (fromChainId: string, toChainId: string, amount: string) => Promise<{
    bridgeFee: string;
    destinationFee: string;
    estimatedTime: string;
  }>;
  isLoading: boolean;
}

interface FeeEstimate {
  bridgeFee: string;
  destinationFee: string;
  estimatedTime: string;
}

export function BridgeTransferForm({
  chains,
  balances,
  onTransfer,
  onEstimateFees,
  isLoading
}: BridgeTransferFormProps) {
  const [fromChainId, setFromChainId] = useState<string>('');
  const [toChainId, setToChainId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [error, setError] = useState<PolkadotHubError | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const estimateDebounced = setTimeout(() => {
      if (fromChainId && toChainId && amount && validateAmount(amount)) {
        void estimateFees();
      } else {
        setFeeEstimate(null);
      }
    }, 500);

    return () => clearTimeout(estimateDebounced);
  }, [fromChainId, toChainId, amount]);

  const validateAmount = (value: string): boolean => {
    if (!value) return false;
    try {
      const amountBN = BigInt(value);
      if (amountBN <= BigInt(0)) return false;
      
      const fromChain = chains.find(c => c.id === fromChainId);
      if (!fromChain) return false;

      const balance = balances[fromChainId];
      if (!balance) return false;

      const balanceBN = BigInt(balance);
      if (amountBN > balanceBN) return false;

      if (fromChain.minTransfer && amountBN < BigInt(fromChain.minTransfer)) return false;
      if (fromChain.maxTransfer && amountBN > BigInt(fromChain.maxTransfer)) return false;

      return true;
    } catch {
      return false;
    }
  };

  const validateRecipient = (address: string): boolean => {
    // Basic validation - should be replaced with chain-specific validation
    return address.length >= 32 && address.length <= 64;
  };

  const estimateFees = async () => {
    if (!fromChainId || !toChainId || !amount) return;
    
    try {
      setIsEstimating(true);
      setError(null);
      const estimate = await onEstimateFees(fromChainId, toChainId, amount);
      setFeeEstimate(estimate);
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        setError(error);
      } else {
        setError(new PolkadotHubError(
          'Failed to estimate fees',
          'ESTIMATE_ERROR',
          'Unable to calculate transfer fees. Please try again.'
        ));
      }
      setFeeEstimate(null);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromChainId || !toChainId || !amount || !recipient) return;
    
    if (!validateAmount(amount)) {
      setError(new PolkadotHubError(
        'Invalid amount',
        'INVALID_AMOUNT',
        'Please enter a valid amount within the allowed limits.'
      ));
      return;
    }

    if (!validateRecipient(recipient)) {
      setError(new PolkadotHubError(
        'Invalid recipient',
        'INVALID_RECIPIENT',
        'Please enter a valid recipient address.'
      ));
      return;
    }

    try {
      setIsTransferring(true);
      setError(null);
      await onTransfer(fromChainId, toChainId, amount, recipient);
      // Reset form after successful transfer
      setAmount('');
      setRecipient('');
      setFeeEstimate(null);
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        setError(error);
      } else {
        setError(new PolkadotHubError(
          'Transfer failed',
          'TRANSFER_ERROR',
          'Failed to process the transfer. Please try again.'
        ));
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const formatBalance = (balance: string | undefined, decimals: number): string => {
    if (!balance) return '0';
    try {
      const num = BigInt(balance);
      const divisor = BigInt(10 ** decimals);
      const integerPart = num / divisor;
      const fractionalPart = num % divisor;
      return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
    } catch {
      return '0';
    }
  };

  const getMinMaxInfo = (chain?: ChainInfo) => {
    if (!chain) return '';
    const min = chain.minTransfer ? 
      `Min: ${formatBalance(chain.minTransfer, chain.decimals)} ${chain.symbol}` : '';
    const max = chain.maxTransfer ? 
      `Max: ${formatBalance(chain.maxTransfer, chain.decimals)} ${chain.symbol}` : '';
    return [min, max].filter(Boolean).join(' • ');
  };

  const isFormValid = fromChainId && toChainId && amount && recipient && 
    validateAmount(amount) && validateRecipient(recipient);

  const isProcessing = isLoading || isTransferring;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-6">
      {error && (
        <ErrorDisplay
          error={error}
          action={{
            label: 'Dismiss',
            onClick: () => setError(null)
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Chain
          </label>
          <select
            value={fromChainId}
            onChange={(e) => {
              setFromChainId(e.target.value);
              setFeeEstimate(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isProcessing}
          >
            <option value="">Select source chain</option>
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id} disabled={!chain.bridgeEnabled}>
                {chain.name} ({chain.symbol}) - Balance: {
                  balances[chain.id]
                    ? formatBalance(balances[chain.id], chain.decimals)
                    : '0'
                }
              </option>
            ))}
          </select>
          {fromChainId && (
            <p className="mt-1 text-xs text-gray-500">
              {getMinMaxInfo(chains.find(c => c.id === fromChainId))}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Chain
          </label>
          <select
            value={toChainId}
            onChange={(e) => {
              setToChainId(e.target.value);
              setFeeEstimate(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isProcessing}
          >
            <option value="">Select destination chain</option>
            {chains
              .filter(chain => chain.id !== fromChainId && chain.bridgeEnabled)
              .map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} ({chain.symbol})
                </option>
              ))
            }
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '' || /^\d+$/.test(value)) {
                setAmount(value);
              }
            }}
            className={`w-full px-3 py-2 border rounded-md ${
              amount && !validateAmount(amount)
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
            }`}
            placeholder="Enter amount"
            disabled={isProcessing}
          />
          {fromChainId && (
            <span className="absolute right-3 top-2 text-gray-500">
              {chains.find(c => c.id === fromChainId)?.symbol}
            </span>
          )}
        </div>
        {amount && !validateAmount(amount) && (
          <p className="mt-1 text-sm text-red-600">
            Please enter a valid amount within the allowed limits
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Address
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          className={`w-full px-3 py-2 border rounded-md ${
            recipient && !validateRecipient(recipient)
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
          }`}
          placeholder="Enter recipient address"
          disabled={isProcessing}
        />
        {recipient && !validateRecipient(recipient) && (
          <p className="mt-1 text-sm text-red-600">
            Please enter a valid recipient address
          </p>
        )}
      </div>

      {isEstimating ? (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
            <span className="ml-2 text-sm text-gray-600">Estimating fees...</span>
          </div>
        </div>
      ) : feeEstimate && (
        <div className="bg-gray-50 p-4 rounded-md space-y-2">
          <h4 className="font-medium">Estimated Fees</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Bridge Fee</p>
              <p className="font-medium">{feeEstimate.bridgeFee}</p>
            </div>
            <div>
              <p className="text-gray-600">Destination Fee</p>
              <p className="font-medium">{feeEstimate.destinationFee}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Estimated Time: {feeEstimate.estimatedTime}
          </p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 disabled:opacity-50"
        disabled={isProcessing || !isFormValid}
      >
        {isTransferring ? 'Processing Transfer...' : 
         isLoading ? 'Loading...' : 'Initiate Transfer'}
      </button>
    </form>
  );
} 