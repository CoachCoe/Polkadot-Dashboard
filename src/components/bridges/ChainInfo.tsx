import React from 'react';
import { ChainInfo as ChainInfoType } from '@/services/bridges';

interface ChainInfoProps {
  chains: ChainInfoType[];
  balances: Record<string, string>;
  isLoading: boolean;
  onSelectChain?: (chainId: string) => void;
  selectedChainId?: string | undefined;
}

export function ChainInfo({
  chains,
  balances,
  isLoading,
  onSelectChain,
  selectedChainId
}: ChainInfoProps) {
  const formatBalance = (balance: string | undefined, decimals: number): string => {
    if (!balance) return '-';
    try {
      const num = BigInt(balance);
      const divisor = BigInt(10 ** decimals);
      const integerPart = num / divisor;
      const fractionalPart = num % divisor;
      return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {chains.map(chain => (
        <div
          key={chain.id}
          className={`
            p-6 rounded-lg shadow-sm cursor-pointer transition-all
            ${selectedChainId === chain.id
              ? 'bg-pink-50 border-2 border-pink-600'
              : 'bg-white hover:bg-gray-50 border-2 border-transparent'
            }
          `}
          onClick={() => onSelectChain?.(chain.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{chain.name}</h3>
            <span className="text-sm text-gray-500">{chain.symbol}</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-xl font-medium">
                {balances[chain.id]
                  ? `${formatBalance(balances[chain.id], chain.decimals)} ${chain.symbol}`
                  : '-'
                }
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Existential Deposit</p>
              <p className="text-sm">
                {formatBalance(chain.existentialDeposit, chain.decimals)} {chain.symbol}
              </p>
            </div>

            {!chain.bridgeEnabled && (
              <div className="mt-2">
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Bridge Disabled
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 