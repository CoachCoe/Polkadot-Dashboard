'use client';

import React, { useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { selectedAccount, accounts, isConnected, connect, disconnect, selectAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (address: string) => {
    const account = accounts.find(acc => acc.address === address);
    if (account) {
      selectAccount(account);
    }
  };

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          {error && (
            <p className="text-red-600 mb-4 text-sm">{error}</p>
          )}
          <Button
            onClick={() => void handleConnect()}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Wallet</h2>
          <Button
            variant="outline"
            onClick={disconnect}
          >
            Disconnect
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Select Account
          </label>
          <Select
            value={selectedAccount?.address || ''}
            onValueChange={handleAccountSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem
                  key={account.address}
                  value={account.address}
                >
                  {account.meta.name || account.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAccount && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Connected Account
            </h3>
            <p className="font-mono text-sm break-all">
              {selectedAccount.address}
            </p>
            {selectedAccount.meta.name && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedAccount.meta.name}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
} 