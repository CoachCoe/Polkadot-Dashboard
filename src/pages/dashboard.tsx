import React from 'react';
import { NextPage } from 'next';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import StakingDashboard from '@/components/staking/StakingDashboard';

const DashboardPage: NextPage = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Polkadot Dashboard</h1>
        <StakingDashboard />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage; 