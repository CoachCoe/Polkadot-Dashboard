'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { WalletConnect } from '@/components/wallet/WalletConnect';

// Dynamically import components with loading fallbacks
const ReferendumList = dynamic(
  () => import('@/components/governance/ReferendumList').then(mod => mod.ReferendumList),
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
  const { selectedAccount } = useWalletStore();
  const [showGuide, setShowGuide] = React.useState(false);

  // Show wallet connection prompt if not connected
  if (!selectedAccount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <p className="text-gray-600 mb-4">Please connect your wallet to access governance features.</p>
            <WalletConnect />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Governance</h1>
            <p className="mt-3 text-xl text-gray-600 max-w-2xl">
              Participate in Polkadot's on-chain governance and shape the future of the network
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-polkadot-pink hover:bg-polkadot-pink-dark transition-colors duration-200 rounded-lg shadow-sm hover:shadow-md"
          >
            Learn about OpenGov
          </button>
        </div>

        {showGuide && <OpenGovGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />}

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Governance Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
                <p className="text-sm font-medium text-gray-600 mb-2">Active Referenda</p>
                <p className="text-3xl font-bold text-gray-900">Loading...</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
                <p className="text-sm font-medium text-gray-600 mb-2">Total Votes</p>
                <p className="text-3xl font-bold text-gray-900">Loading...</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
                <p className="text-sm font-medium text-gray-600 mb-2">Participation Rate</p>
                <p className="text-3xl font-bold text-gray-900">Loading...</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white shadow-lg rounded-xl border-0 overflow-hidden">
            <Tabs defaultValue="referendums" className="w-full">
              <div className="px-8 pt-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md gap-2 p-1 bg-gray-100 rounded-lg">
                  <TabsTrigger 
                    value="referendums"
                    className="px-6 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-polkadot-pink data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Referendums
                  </TabsTrigger>
                  <TabsTrigger 
                    value="delegation"
                    className="px-6 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-polkadot-pink data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Delegation
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-8">
                <TabsContent value="referendums" className="mt-0">
                  <ReferendumList />
                </TabsContent>
                
                <TabsContent value="delegation" className="mt-0">
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