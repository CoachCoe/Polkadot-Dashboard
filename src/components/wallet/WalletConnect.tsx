'use client';

import React, { useState, memo } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { WalletIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getWallets, type Wallet } from '@talismn/connect-wallets';
import { retry } from '@/utils/common';
import { configService } from '@/services/configService';
import { ERROR_MESSAGES } from '@/config/constants';
import type { WalletAccount } from '@/types/wallet';

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect = memo(function WalletConnect({ className }: WalletConnectProps) {
  const { selectedAccount, connect, disconnect } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletList, setShowWalletList] = useState(false);

  const handleConnect = async (wallet: Wallet) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!wallet.installed) {
        window.open(wallet.installUrl, '_blank');
        return;
      }

      await retry(
        async () => {
      await wallet.enable('Polkadot Dashboard');
          await connect(wallet);
        },
        configService.maxRetryAttempts,
        configService.retryDelay
      );
      
      setShowWalletList(false);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(ERROR_MESSAGES.WALLET_CONNECTION_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const getDisplayName = (account: WalletAccount): string => {
    if (account.name) return account.name;
    if (account.source) return `${account.source} Account`;
    return `${account.address.slice(0, 4)}...${account.address.slice(-4)}`;
  };

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => {
            setError(null);
            setShowWalletList(true);
          }}
        >
          Try Again
        </Button>
      </Card>
    );
  }

  if (selectedAccount) {
    return (
      <Popover open={showWalletList} onOpenChange={setShowWalletList}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={`flex items-center gap-2 ${className}`}>
            <WalletIcon className="h-5 w-5" />
            <span className="truncate max-w-[150px]">
              {getDisplayName(selectedAccount)}
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
          className={`flex items-center gap-2 ${className}`}
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
                disabled={isLoading}
                onClick={() => void handleConnect(wallet)}
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
}); 