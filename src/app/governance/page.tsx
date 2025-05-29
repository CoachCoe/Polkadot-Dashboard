'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletStore } from '@/store/useWalletStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { WalletConnect } from '@/components/wallet/WalletConnect';

// Dynamically import components with loading fallbacks
const ReferendumList = dynamic(
  () => import('@/components/governance/ReferendumList').then(mod => ({ default: mod.ReferendumList })),
  { 
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <LoadingSpinner className="w-8 h-8 mx-auto" />
      </Card>
    )
  }
);

const Delegation = dynamic(
  () => import('@/components/governance/Delegation').then(mod => ({ default: mod.Delegation })),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <LoadingSpinner className="w-8 h-8 mx-auto" />
      </Card>
    )
  }
);

const OpenGovGuide = dynamic(
  () => import('@/components/governance/OpenGovGuide').then(mod => ({ default: mod.OpenGovGuide })),
  {
    ssr: false,
    loading: () => null
  }
);

export default function GovernancePage() {
  const { isAuthenticated } = useAuth();
  const { selectedAccount } = useWalletStore();
  const [showGuide, setShowGuide] = React.useState(false);

  // Show wallet connection prompt if not authenticated
  if (!isAuthenticated || !selectedAccount) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 max-w-2xl mx-auto bg-white shadow-sm border border-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Please connect your wallet to access governance features and participate in on-chain democracy.
            </p>
            <WalletConnect />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Governance</h1>
            <p className="mt-2 text-gray-600 text-lg">
              Participate in Polkadot's on-chain governance and shape the future of the network
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary/90 transition-colors"
          >
            Learn about OpenGov
          </button>
        </div>

        {showGuide && <OpenGovGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />}

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6 bg-white shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Governance Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Active Referenda</p>
                <p className="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Votes</p>
                <p className="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Participation Rate</p>
                <p className="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white shadow-sm border border-gray-100">
            <Tabs defaultValue="referendums" className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger 
                    value="referendums"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Referendums
                  </TabsTrigger>
                  <TabsTrigger 
                    value="delegation"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Delegation
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="referendums">
                  <ReferendumList />
                </TabsContent>
                
                <TabsContent value="delegation">
                  <Delegation />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
} 