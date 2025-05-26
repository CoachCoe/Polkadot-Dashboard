'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import { Skeleton } from '@/components/ui/Skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { PaperAirplaneIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  logo: string;
  chain: string;
}

export function TokenList() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    async function loadTokens() {
      if (!selectedAccount) return;
      
      try {
        setIsLoading(true);
        const data = await portfolioService.getTokenBalances(selectedAccount.address);
        setTokens(data);
      } catch (error) {
        console.error('Failed to load token balances:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadTokens();
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((token) => (
        <div key={token.symbol} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="relative w-10 h-10">
              <Image
                src={token.logo}
                alt={token.name}
                fill
                className="rounded-full"
              />
            </div>
            <div>
              <h3 className="font-semibold">{token.name}</h3>
              <p className="text-sm text-gray-500">{token.chain}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <p className="font-semibold">{token.balance} {token.symbol}</p>
            <p className="text-sm text-gray-500">${token.usdValue}</p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button variant="outline" size="sm">
              <PaperAirplaneIcon className="w-4 h-4 mr-1" />
              Send
            </Button>
            <Button variant="outline" size="sm">
              <ArrowsRightLeftIcon className="w-4 h-4 mr-1" />
              Swap
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 