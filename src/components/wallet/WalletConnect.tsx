'use client';

import React, { useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { ChevronDownIcon, WalletIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

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

  const handleAccountSelect = (account: typeof accounts[0]) => {
    selectAccount(account);
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => void handleConnect()}
        disabled={isLoading}
        className={cn(
          "bg-[#E6007A] hover:bg-[#FF1493] text-white rounded-full px-6 py-2 flex items-center gap-2",
          className
        )}
      >
        <WalletIcon className="w-5 h-5" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="border-2 border-[#E6007A] text-[#E6007A] hover:bg-[#E6007A] hover:text-white rounded-full px-4 py-2 flex items-center gap-2"
          >
            <WalletIcon className="w-5 h-5" />
            <span className="max-w-[150px] truncate">
              {selectedAccount?.meta.name || selectedAccount?.address.slice(0, 8) + '...'}
            </span>
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Connected Wallet</h2>
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {accounts.map((account) => (
              <button
                key={account.address}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedAccount?.address === account.address ? 'bg-gray-50' : ''
                }`}
                onClick={() => handleAccountSelect(account)}
              >
                <div className="w-8 h-8 rounded-full bg-[#E6007A]/10 flex items-center justify-center">
                  <WalletIcon className="w-4 h-4 text-[#E6007A]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">
                    {account.meta.name || 'Account'}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">
                    {account.address.slice(0, 16)}...{account.address.slice(-8)}
                  </p>
                </div>
                {selectedAccount?.address === account.address && (
                  <div className="w-2 h-2 rounded-full bg-[#E6007A]" />
                )}
              </button>
            ))}
          </div>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 