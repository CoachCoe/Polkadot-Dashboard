'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { walletService, type WalletProvider, type WalletAccount } from '@/services/walletService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { selectedAccount, setSelectedAccount } = useWalletStore();
  const [providers, setProviders] = useState<WalletProvider[]>([]);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initWallet();
  }, []);

  const initWallet = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await walletService.init();
      setProviders(walletService.getProviders());
      setAccounts(walletService.getAccounts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await walletService.disconnect();
      setSelectedAccount(null);
      setAccounts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  const handleAccountSelect = (account: WalletAccount) => {
    setSelectedAccount(account);
  };

  const handleProviderClick = (provider: WalletProvider) => {
    if (provider.installed) {
      void initWallet();
    } else {
      if (typeof window !== 'undefined') {
        window.open(provider.website, '_blank');
      }
    }
  };

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Connect Wallet</h2>
          {walletService.isConnected() && (
            <Button
              variant="outline"
              onClick={() => void handleDisconnect()}
              className="flex items-center gap-2"
            >
              Disconnect
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!walletService.isConnected() ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Connect with one of our available wallet providers:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 border rounded-lg ${
                    provider.installed
                      ? 'border-gray-200 hover:border-pink-500 cursor-pointer'
                      : 'border-gray-100 opacity-50'
                  }`}
                  onClick={() => handleProviderClick(provider)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 relative">
                      <Image
                        src={provider.logo}
                        alt={provider.name}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-gray-500">
                        {provider.installed ? 'Installed' : 'Not installed'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Select an account to connect with:
            </p>
            <div className="space-y-2">
              {accounts.map((account) => {
                const provider = providers.find(p => p.id === account.provider);
                return (
                  <div
                    key={account.address}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedAccount?.address === account.address
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-500'
                    }`}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <div className="flex items-center gap-3">
                      {provider && (
                        <div className="w-8 h-8 relative">
                          <Image
                            src={provider.logo}
                            alt={provider.name}
                            width={32}
                            height={32}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {account.meta.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {account.address}
                        </p>
                      </div>
                      {account.balance && (
                        <div className="text-right">
                          <p className="font-medium">{account.balance}</p>
                          <p className="text-sm text-gray-500">DOT</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <ArrowPathIcon className="h-8 w-8 text-pink-500 animate-spin" />
          </div>
        )}
      </div>
    </Card>
  );
} 