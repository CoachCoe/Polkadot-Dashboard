'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BridgeProvider } from '@/services/bridgeService';

interface BridgeDirectoryProps {
  onSelectBridge?: (bridgeId: string) => void;
}

export function BridgeDirectory({ onSelectBridge }: BridgeDirectoryProps) {
  const [bridges, setBridges] = React.useState<BridgeProvider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadBridges = async () => {
      try {
        // TODO: Replace with actual bridge service call
        const mockBridges: BridgeProvider[] = [
          {
            id: 'xcm',
            name: 'XCM Transfer',
            description: 'Native cross-chain messaging for Polkadot ecosystem',
            supportedChains: ['asset-hub', 'acala', 'astar', 'moonbeam'],
            minimumAmount: '1',
            maximumAmount: '10000',
            estimatedTime: '2-5 minutes',
            fee: '0.5'
          },
          {
            id: 'wormhole',
            name: 'Wormhole',
            description: 'Secure and fast cross-chain bridge',
            supportedChains: ['polkadot', 'ethereum', 'solana', 'binance-smart-chain'],
            minimumAmount: '10',
            maximumAmount: '1000000',
            estimatedTime: '15-20 minutes',
            fee: '0.1%'
          },
          {
            id: 'multichain',
            name: 'Multichain',
            description: 'Cross-chain router protocol',
            supportedChains: ['polkadot', 'ethereum', 'binance-smart-chain'],
            minimumAmount: '50',
            maximumAmount: '500000',
            estimatedTime: '10-30 minutes',
            fee: '0.3%'
          }
        ];
        setBridges(mockBridges);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load bridges:', error);
        setIsLoading(false);
      }
    };

    loadBridges();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bridges.map((bridge) => (
        <Card
          key={bridge.id}
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelectBridge?.(bridge.id)}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{bridge.name}</h3>
                <p className="text-sm text-gray-500">{bridge.description}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {bridge.supportedChains.map((chain) => (
                <Badge key={chain} variant="secondary">
                  {chain}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Min Amount:</span>
                <span className="ml-1">{bridge.minimumAmount} DOT</span>
              </div>
              <div>
                <span className="text-gray-500">Max Amount:</span>
                <span className="ml-1">{bridge.maximumAmount} DOT</span>
              </div>
              <div>
                <span className="text-gray-500">Est. Time:</span>
                <span className="ml-1">{bridge.estimatedTime}</span>
              </div>
              <div>
                <span className="text-gray-500">Fee:</span>
                <span className="ml-1">{bridge.fee}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 