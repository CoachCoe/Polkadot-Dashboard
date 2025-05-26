import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { BridgeTransfer } from '@/components/bridge/BridgeTransfer';
import { OnRamp } from '@/components/bridge/OnRamp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function BridgePage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bridge & Buy</h1>
          <p className="mt-2 text-gray-600">
            Transfer tokens between chains or buy crypto with fiat currency.
          </p>
        </div>

        <Tabs defaultValue="bridge">
          <TabsList>
            <TabsTrigger value="bridge">Bridge Transfer</TabsTrigger>
            <TabsTrigger value="onramp">Buy Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="bridge" className="mt-6">
            <BridgeTransfer />
          </TabsContent>

          <TabsContent value="onramp" className="mt-6">
            <OnRamp />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 