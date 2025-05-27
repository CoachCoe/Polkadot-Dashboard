'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { bridgeService, BridgeQuote } from '@/services/bridgeService';
import { BridgeError } from '@/components/bridge/BridgeError';
import { PolkadotHubError } from '@/utils/errorHandling';

interface CrossChainSwapProps {
  bridgeId?: string | undefined;
}

export function CrossChainSwap({ bridgeId }: CrossChainSwapProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [fromChain, setFromChain] = React.useState('');
  const [toChain, setToChain] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [quote, setQuote] = React.useState<BridgeQuote | null>(null);
  const [error, setError] = React.useState<PolkadotHubError | null>(null);

  const chains = [
    { value: 'polkadot', label: 'Polkadot' },
    { value: 'asset-hub', label: 'Asset Hub' },
    { value: 'acala', label: 'Acala' },
    { value: 'astar', label: 'Astar' },
    { value: 'moonbeam', label: 'Moonbeam' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'binance-smart-chain', label: 'BSC' }
  ];

  const handleGetQuote = async () => {
    if (!fromChain || !toChain || !amount) {
      showToast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const quoteResult = await bridgeService.getBridgeQuote(fromChain, toChain, amount, bridgeId);
      setQuote(quoteResult);
    } catch (error) {
      const bridgeError = error instanceof PolkadotHubError ? error : new PolkadotHubError(
        'Failed to get quote',
        'BRIDGE_ERROR',
        'Could not get a quote for the bridge transfer.'
      );
      setError(bridgeError);
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) {
      showToast({
        title: 'Error',
        description: 'Please get a quote first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implement actual swap execution
      showToast({
        title: 'Success',
        description: 'Swap initiated successfully',
      });
    } catch (error) {
      const bridgeError = error instanceof PolkadotHubError ? error : new PolkadotHubError(
        'Failed to execute swap',
        'BRIDGE_ERROR',
        'Could not complete the bridge transfer.'
      );
      setError(bridgeError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (!quote) {
      handleGetQuote();
    } else {
      handleSwap();
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Cross-Chain Swap</h2>
      
      {error && (
        <div className="mb-6">
          <BridgeError error={error} onRetry={handleRetry} />
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Chain</label>
            <Select value={fromChain} onValueChange={setFromChain}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select source chain" />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.value} value={chain.value}>
                    {chain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">To Chain</label>
            <Select value={toChain} onValueChange={setToChain}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select destination chain" />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.value} value={chain.value}>
                    {chain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={isLoading}
          />
        </div>

        {quote && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Fee:</span>
              <span className="font-medium">{quote.fee} DOT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Output:</span>
              <span className="font-medium">{quote.expectedOutput} DOT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="font-medium">{quote.estimatedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-medium">{quote.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-medium">{quote.route.join(' → ')}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleGetQuote}
            disabled={isLoading || !fromChain || !toChain || !amount}
          >
            Get Quote
          </Button>
          
          {quote && (
            <Button
              onClick={handleSwap}
              disabled={isLoading}
              variant="default"
            >
              Swap
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
} 