'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { bridgeService, type OnRampProvider, type OnRampQuote } from '@/services/bridgeService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface OnRampProps {
  className?: string;
}

export function OnRamp({ className }: OnRampProps) {
  const { selectedAccount } = useWalletStore();
  const [providers, setProviders] = useState<OnRampProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [cryptoCurrency, setCryptoCurrency] = useState('DOT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<OnRampQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider && amount && fiatCurrency && cryptoCurrency) {
      void getQuote();
    } else {
      setQuote(null);
    }
  }, [selectedProvider, amount, fiatCurrency, cryptoCurrency]);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bridgeService.getOnRampProviders();
      setProviders(data);
      if (data && data.length > 0) {
        const firstProvider = data[0];
        if (firstProvider) {
          setSelectedProvider(firstProvider.id);
          // Set initial supported currencies
          const firstFiatCurrency = firstProvider.supportedFiatCurrencies[0];
          const firstCrypto = firstProvider.supportedCryptos[0];

          if (typeof firstFiatCurrency === 'string') {
            setFiatCurrency(firstFiatCurrency);
          }
          if (typeof firstCrypto === 'string') {
            setCryptoCurrency(firstCrypto);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load on-ramp providers');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuote = async () => {
    try {
      setError(null);
      const provider = providers.find(p => p.id === selectedProvider);
      if (!provider) {
        throw new Error('Selected provider not found');
      }

      // Calculate quote based on provider fees
      const feePercentage = parseFloat(provider.fees) / 100;
      const feeAmount = parseFloat(amount) * feePercentage;
      const rate = 30; // Mock exchange rate, in real implementation this would come from an oracle or API

      const quoteData: OnRampQuote = {
        provider: provider.name,
        fiatCurrency,
        fiatAmount: amount,
        cryptoCurrency,
        cryptoAmount: ((parseFloat(amount) - feeAmount) / rate).toFixed(4),
        rate: rate.toString(),
        fee: feeAmount.toFixed(2),
        total: amount
      };

      setQuote(quoteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
    }
  };

  const handleBuy = async () => {
    if (!selectedAccount || !selectedProvider || !amount) return;

    try {
      setIsLoading(true);
      setError(null);
      const orderId = await bridgeService.executeOnRamp(
        selectedAccount.address,
        selectedProvider,
        fiatCurrency,
        cryptoCurrency,
        amount
      );
      // Reset form
      setAmount('');
      setQuote(null);
      // Show success message or handle redirect
      console.log('Order created:', orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate purchase');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProviderDetails = providers.find(p => p.id === selectedProvider);

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    setSelectedProvider(providerId);
    if (provider) {
      // Update currencies to first supported ones when changing provider
      const firstFiatCurrency = provider.supportedFiatCurrencies[0];
      const firstCrypto = provider.supportedCryptos[0];
      
      if (firstFiatCurrency) {
        setFiatCurrency(firstFiatCurrency);
      }
      if (firstCrypto) {
        setCryptoCurrency(firstCrypto);
      }
    }
    setQuote(null);
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isLoading}
            >
              <option value="">Select a provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - Fees: {provider.fees}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md pr-16"
                placeholder="0.00"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  value={fiatCurrency}
                  onChange={(e) => setFiatCurrency(e.target.value)}
                  className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                  disabled={isLoading}
                >
                  {selectedProviderDetails?.supportedFiatCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              You Receive
            </label>
            <div className="relative">
              <input
                type="text"
                value={quote?.cryptoAmount || ''}
                className="w-full px-3 py-2 border rounded-md pr-16 bg-gray-50"
                disabled
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  value={cryptoCurrency}
                  onChange={(e) => setCryptoCurrency(e.target.value)}
                  className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                  disabled={isLoading}
                >
                  {selectedProviderDetails?.supportedCryptos.map((crypto) => (
                    <option key={crypto} value={crypto}>
                      {crypto}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {selectedProviderDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Provider Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Minimum Amount</p>
                <p className="font-medium">{selectedProviderDetails.minimumAmount} {fiatCurrency}</p>
              </div>
              <div>
                <p className="text-gray-500">Maximum Amount</p>
                <p className="font-medium">{selectedProviderDetails.maximumAmount} {fiatCurrency}</p>
              </div>
              <div>
                <p className="text-gray-500">Estimated Time</p>
                <p className="font-medium">{selectedProviderDetails.estimatedTime}</p>
              </div>
              <div>
                <p className="text-gray-500">KYC Required</p>
                <p className="font-medium">
                  {selectedProviderDetails.kycRequired ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        )}

        {quote && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Quote Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600">You Pay</p>
                <p className="font-medium">{quote.fiatAmount} {fiatCurrency}</p>
              </div>
              <div>
                <p className="text-blue-600">You Receive</p>
                <p className="font-medium">{quote.cryptoAmount} {cryptoCurrency}</p>
              </div>
              <div>
                <p className="text-blue-600">Fee</p>
                <p className="font-medium">{quote.fee} {fiatCurrency}</p>
              </div>
              <div>
                <p className="text-blue-600">Provider</p>
                <p className="font-medium">{quote.provider}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          onClick={() => void handleBuy()}
          className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white"
          disabled={!selectedAccount || !selectedProvider || !amount || isLoading || !quote}
        >
          {isLoading ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            'Buy Crypto'
          )}
        </Button>
      </Card>
    </div>
  );
} 