'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';

const VotingHistory = dynamic(() => import('@/components/governance/VotingHistory').then(mod => ({ default: mod.VotingHistory })), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-6 w-1/2 bg-gray-200 animate-pulse rounded"></div>
      </div>
    </Card>
  )
});

const OpenGovGuide = dynamic(() => import('@/components/governance/OpenGovGuide').then(mod => ({ default: mod.OpenGovGuide })), {
  ssr: false
});

const VotingPowerVisualizer = dynamic(() => import('@/components/governance/VotingPowerVisualizer').then(mod => ({ default: mod.VotingPowerVisualizer })), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
    </Card>
  )
});

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  address: string;
  balance?: string;
}

export default function GovernancePage() {
  const { data: session } = useSession();
  const [showGuide, setShowGuide] = React.useState(false);
  const user = session?.user as User | undefined;
  const userAddress = user?.address || '';
  const userBalance = user?.balance || '0';

  if (!userAddress) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Please connect your wallet to access governance features.
        </p>
      </Card>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Governance</h1>
        <button
          onClick={() => setShowGuide(true)}
          className="text-primary hover:underline"
        >
          Learn about OpenGov
        </button>
      </div>

      <OpenGovGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <Tabs defaultValue="voting-power">
        <TabsList>
          <TabsTrigger value="voting-power">Voting Power</TabsTrigger>
          <TabsTrigger value="voting-history">Voting History</TabsTrigger>
          <TabsTrigger value="delegation">Delegation</TabsTrigger>
        </TabsList>

        <TabsContent value="voting-power" className="mt-6">
          <VotingPowerVisualizer balance={userBalance} />
        </TabsContent>

        <TabsContent value="voting-history" className="mt-6">
          <VotingHistory address={userAddress} />
        </TabsContent>

        <TabsContent value="delegation" className="mt-6">
          <Card className="p-6">
            <p>Delegation features coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 