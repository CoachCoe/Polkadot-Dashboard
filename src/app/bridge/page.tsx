'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { BridgeDirectory } from '@/components/bridge/BridgeDirectory';
import { CrossChainSwap } from '@/components/bridge/CrossChainSwap';
import { TransactionHistory } from '@/components/bridge/TransactionHistory';
import { BridgeTransfer } from '@/components/bridge/BridgeTransfer';
import { OnRamp } from '@/components/bridge/OnRamp';

export default function BridgePage() {
  const { data: session } = useSession();
  const [selectedBridge, setSelectedBridge] = React.useState<string | undefined>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Bridge & Transfer</h1>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="directory">Bridge Directory</TabsTrigger>
          <TabsTrigger value="swap">Cross-Chain Swap</TabsTrigger>
          <TabsTrigger value="transfer">Bridge Transfer</TabsTrigger>
          <TabsTrigger value="onramp">Buy Crypto</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <BridgeDirectory onSelectBridge={setSelectedBridge} />
        </TabsContent>

        <TabsContent value="swap">
          <CrossChainSwap bridgeId={selectedBridge} />
        </TabsContent>

        <TabsContent value="transfer">
          <BridgeTransfer />
        </TabsContent>

        <TabsContent value="onramp">
          <OnRamp />
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory address={session?.user?.address} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 