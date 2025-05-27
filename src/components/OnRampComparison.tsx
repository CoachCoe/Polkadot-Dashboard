'use client';

import { useState, useEffect } from 'react';
import { onRampService, type OnRampQuote } from '@/services/onRampService';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/utils/formatters';

interface OnRampComparisonProps {
  onProviderSelect: (providerId: string) => void;
}

export const OnRampComparison: React.FC<OnRampComparisonProps> = ({ onProviderSelect }) => {
  const { address } = useWallet();
  const [amount, setAmount] = useState<string>('100');
  const [fiatCurrency, setFiatCurrency] = useState<string>('USD');
  const [cryptoCurrency, setCryptoCurrency] = useState<string>('DOT');
  const [quotes, setQuotes] = useState<OnRampQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const providers = onRampService.getProviders();
  const fiatCurrencies = Array.from(
    new Set(providers.flatMap(p => p.supportedFiatCurrencies))
  );
  const cryptoCurrencies = Array.from(
    new Set(providers.flatMap(p => p.supportedCryptos))
  );

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const quotePromises = providers.map(async provider => {
        try {
          return await onRampService.getQuote(
            provider.id,
            fiatCurrency,
            cryptoCurrency,
            amount
          );
        } catch {
          return null;
        }
      });

      const results = await Promise.all(quotePromises);
      const validQuotes = results.filter(Boolean) as OnRampQuote[];
      setQuotes(onRampService.compareQuotes(validQuotes));
    } catch (err) {
      setError('Failed to fetch quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (amount && fiatCurrency && cryptoCurrency) {
      fetchQuotes();
    }
  }, [amount, fiatCurrency, cryptoCurrency]);

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            value={amount}
            onChange={e => handleAmountChange(e.target.value)}
            placeholder={`Enter amount in ${fiatCurrency}`}
            type="text"
          />
        </div>
        <div>
          <Select
            value={fiatCurrency}
            onValueChange={(value: string) => setFiatCurrency(value)}
            items={fiatCurrencies.map(currency => ({
              label: currency,
              value: currency
            }))}
          />
        </div>
        <div>
          <Select
            value={cryptoCurrency}
            onValueChange={(value: string) => setCryptoCurrency(value)}
            items={cryptoCurrencies.map(currency => ({
              label: currency,
              value: currency
            }))}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center">Loading quotes...</div>
        ) : quotes.length > 0 ? (
          quotes.map(quote => {
            const provider = providers.find(p => p.name === quote.provider);
            if (!provider) return null;

            return (
              <Card key={provider.id} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <Badge variant={provider.type === 'fiat' ? 'default' : 'secondary'}>
                    {provider.type}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rate</span>
                    <span>1 {cryptoCurrency} = {formatCurrency(quote.rate, fiatCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">You Get</span>
                    <span>{quote.cryptoAmount} {cryptoCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fees</span>
                    <span>{formatCurrency(quote.fees.total, fiatCurrency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost</span>
                    <span>{formatCurrency(quote.total, fiatCurrency)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    <span>⏱️ {quote.estimatedTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quote.paymentMethods.map(method => (
                      <Badge key={method} variant="outline">
                        {method.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => onProviderSelect(provider.id)}
                  disabled={!address}
                  className="w-full"
                >
                  {address ? 'Select Provider' : 'Connect Wallet'}
                </Button>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No quotes available for the selected options
          </div>
        )}
      </div>
    </div>
  );
}; 