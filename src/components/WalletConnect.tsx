'use client';

import React, { useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { WalletIcon, ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { getWallets } from '@talismn/connect-wallets';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// Create a client-only version of the component
const WalletConnectClient = () => {
  const { selectedAccount, setSelectedAccount, loadAccounts } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletList, setShowWalletList] = useState(false);

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

  const getDisplayName = (account: InjectedAccountWithMeta) => {
    // Try to get the name from metadata first
    if (account.meta.name) return account.meta.name;
    
    // Try to get the source name (wallet name)
    if (account.meta.source) return `${account.meta.source} Account`;
    
    // If no name or source, format the address nicely
    const address = account.address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (error) {
    return (
      <Card className="p-6 bg-white/90 backdrop-blur-sm border-red-100 shadow-lg rounded-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <WalletIcon className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Button
            variant="outline"
            className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 transition-all duration-200"
            onClick={() => setError(null)}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (selectedAccount) {
    const accountWithMeta = selectedAccount as InjectedAccountWithMeta;
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-gray-200/80 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-4 py-2 hover:border-pink-200 group relative"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <WalletIcon className="h-3 w-3 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-gray-900">
                {getDisplayName(accountWithMeta)}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <WalletIcon className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{getDisplayName(accountWithMeta)}</h3>
                <p className="text-xs text-gray-500">{accountWithMeta.meta.source || 'Connected'}</p>
              </div>
            </div>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg break-all text-sm font-mono text-gray-600">
              {accountWithMeta.address}
            </div>
          </div>
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border-gray-200 hover:border-red-200 transition-all duration-200"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
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
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-gray-200/80 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-4 py-2 hover:border-pink-200 group"
          disabled={isLoading}
          onClick={() => setShowWalletList(true)}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <WalletIcon className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium text-gray-700 group-hover:text-gray-900">
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Connect Wallet</h3>
          <p className="text-sm text-gray-500 mt-1">Select your preferred wallet to connect</p>
        </div>
        <div className="p-2">
          {getWallets().map((wallet) => (
            <Button
              key={wallet.title}
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start hover:bg-gray-50 rounded-lg p-3 group transition-all duration-200"
              disabled={!wallet.installed}
              onClick={() => {
                if (wallet.installed) {
                  void handleConnect();
                } else {
                  window.open(wallet.installUrl, '_blank');
                }
              }}
            >
              <div className="relative">
                {wallet.logo && (
                  <img 
                    src={wallet.logo.src} 
                    alt={wallet.title} 
                    className="w-10 h-10 rounded-xl shadow-sm group-hover:shadow transition-all duration-200" 
                  />
                )}
                {wallet.installed && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium text-gray-900">{wallet.title}</span>
                <span className="text-xs text-gray-500">
                  {wallet.installed ? 'Installed' : 'Not installed'}
                </span>
              </div>
              {!wallet.installed && (
                <div className="flex items-center text-pink-500 group-hover:text-pink-600">
                  <span className="text-sm font-medium mr-1">Install</span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </div>
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Export a server component that dynamically imports the client component
export function WalletConnect() {
  return <WalletConnectClient />;
} 