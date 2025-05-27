'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ReferendumList } from '@/components/governance/ReferendumList';
import { Delegation } from '@/components/governance/Delegation';
import { FavoriteReferenda } from '@/components/governance/FavoriteReferenda';
import { VotingHistory } from '@/components/governance/VotingHistory';
import { OpenGovEducation } from '@/components/governance/OpenGovEducation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useSession } from 'next-auth/react';

export default function GovernancePage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Governance</h1>
          <p className="mt-2 text-gray-600">
            Participate in on-chain governance by voting on referenda and delegating votes.
          </p>
        </div>

        <Tabs defaultValue="referenda">
          <TabsList>
            <TabsTrigger value="referenda">Referenda</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="voting-history">Voting History</TabsTrigger>
            <TabsTrigger value="delegation">Delegation</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
          </TabsList>

          <TabsContent value="referenda" className="mt-6">
            <ReferendumList />
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <FavoriteReferenda />
          </TabsContent>

          <TabsContent value="voting-history" className="mt-6">
            <VotingHistory address={session?.user?.address} />
          </TabsContent>

          <TabsContent value="delegation" className="mt-6">
            <Delegation />
          </TabsContent>

          <TabsContent value="learn" className="mt-6">
            <OpenGovEducation />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 