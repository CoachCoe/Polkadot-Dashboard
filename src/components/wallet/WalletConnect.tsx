'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { WalletIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getWallets } from '@talismn/connect-wallets';

export function WalletConnect() {
  const { selectedAccount, setSelectedAccount, accounts, loadAccounts } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletList, setShowWalletList] = useState(false);

  useEffect(() => {
    if (!accounts.length) {
      void handleConnect();
    }
  }, [accounts.length]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loadAccounts();
      setShowWalletList(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setSelectedAccount(null);
  };

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => setError(null)}
        >
          Try Again
        </Button>
      </Card>
    );
  }

  if (selectedAccount) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            <span className="truncate max-w-[150px]">
              {(selectedAccount as any).meta?.name || selectedAccount.address}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Connected Account</h3>
              <p className="text-sm text-gray-500 break-all mt-1">
                {selectedAccount.address}
              </p>
            </div>
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={showWalletList} onOpenChange={setShowWalletList}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoading}
          onClick={() => setShowWalletList(true)}
        >
          <WalletIcon className="h-5 w-5" />
          <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4">
        <div className="space-y-4">
          <h3 className="font-medium">Select Wallet</h3>
          <div className="space-y-2">
            {getWallets().map((wallet) => (
              <Button
                key={wallet.title}
                variant="outline"
                className="w-full flex items-center gap-2 justify-start"
                disabled={!wallet.installed}
                onClick={() => {
                  if (wallet.installed) {
                    void handleConnect();
                  } else {
                    window.open(wallet.installUrl, '_blank');
                  }
                }}
              >
                {wallet.logo && (
                  <img src={wallet.logo.src} alt={wallet.title} className="w-6 h-6" />
                )}
                <span>{wallet.title}</span>
                {!wallet.installed && (
                  <span className="ml-auto text-xs text-gray-500">Install</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 