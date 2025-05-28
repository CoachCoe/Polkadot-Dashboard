'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Suspense } from 'react';

// Dynamically import components that use browser APIs with ssr: false
const ReferendumList = dynamic(
  () => import('@/components/governance/ReferendumList').then(mod => ({ default: mod.ReferendumList })),
  { ssr: false }
);

const Delegation = dynamic(
  () => import('@/components/governance/Delegation').then(mod => ({ default: mod.Delegation })),
  { ssr: false }
);

const OpenGovGuide = dynamic(
  () => import('@/components/governance/OpenGovGuide').then(mod => ({ default: mod.OpenGovGuide })),
  { ssr: false }
);

const PolkadotProvider = dynamic(
  () => import('@/providers/PolkadotProvider').then(mod => ({ default: mod.PolkadotProvider })),
  { ssr: false }
);

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  address: string;
  balance?: string;
}

function GovernanceContent() {
  const { data: session } = useSession();
  const [showGuide, setShowGuide] = React.useState(false);
  const user = session?.user as User | undefined;
  const userAddress = user?.address || '';

  // Show wallet connection prompt if no user address
  if (!userAddress) {
    return (
      <div className="container py-8">
        <Card className="p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access governance features and participate in on-chain democracy.
            </p>
          </div>
        </Card>
      </div>
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

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Governance Stats</h2>
          <p className="text-gray-600">Loading governance statistics...</p>
        </Card>
        
        <Tabs defaultValue="referendums" className="space-y-4">
          <TabsList>
            <TabsTrigger value="referendums">Referendums</TabsTrigger>
            <TabsTrigger value="delegation">Delegation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="referendums">
            <Card>
              <Suspense fallback={<div>Loading...</div>}>
                <ReferendumList />
              </Suspense>
            </Card>
          </TabsContent>
          
          <TabsContent value="delegation">
            <Card>
              <Suspense fallback={<div>Loading...</div>}>
                <Delegation />
              </Suspense>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function GovernancePage() {
  return (
    <PolkadotProvider>
      <GovernanceContent />
    </PolkadotProvider>
  );
} 