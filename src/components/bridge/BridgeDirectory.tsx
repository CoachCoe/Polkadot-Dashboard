'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { bridgeService, BridgeProvider } from '@/services/bridgeService';
import { Badge } from '@/components/ui/Badge';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface BridgeDirectoryProps {
  onSelectBridge: (bridgeId: string) => void;
}

export function BridgeDirectory({ onSelectBridge }: BridgeDirectoryProps) {
  const [bridges, setBridges] = React.useState<BridgeProvider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTab, setSelectedTab] = React.useState('all');

  React.useEffect(() => {
    const loadBridges = async () => {
      try {
        const data = await bridgeService.getBridgeProviders();
        setBridges(data);
      } catch (error) {
        console.error('Failed to load bridges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBridges();
  }, []);

  const filteredBridges = React.useMemo(() => {
    if (selectedTab === 'all') return bridges;
    return bridges.filter(bridge => 
      selectedTab === 'native' ? !bridge.isThirdParty : bridge.isThirdParty
    );
  }, [bridges, selectedTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Available Bridges</h2>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All Bridges</TabsTrigger>
            <TabsTrigger value="native">Native</TabsTrigger>
            <TabsTrigger value="third-party">Third Party</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBridges.map((bridge) => (
          <Card key={bridge.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{bridge.name}</h3>
                <p className="text-gray-600 mt-1">{bridge.description}</p>
              </div>
              <Badge variant={bridge.isThirdParty ? "secondary" : "default"}>
                {bridge.isThirdParty ? "Third Party" : "Native"}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Supported Chains</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bridge.supportedChains.map((chain) => (
                      <Badge key={chain} variant="outline">
                        {chain}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Transfer Limits</p>
                  <p className="mt-1">Min: {bridge.minimumAmount}</p>
                  <p className="mt-1">Max: {bridge.maximumAmount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Estimated Time</p>
                  <p className="mt-1">{bridge.estimatedTime}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fee</p>
                  <p className="mt-1">{bridge.fee}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-4">
                  {bridge.website && (
                    <a
                      href={bridge.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Website <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </a>
                  )}
                  {bridge.documentation && (
                    <a
                      href={bridge.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Documentation <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <Button onClick={() => onSelectBridge(bridge.id)}>
                  Use Bridge
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 