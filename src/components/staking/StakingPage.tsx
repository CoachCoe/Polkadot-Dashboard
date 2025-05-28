'use client';

import React from 'react';
import { StakingDashboard } from '@/components/staking/StakingDashboard';
import { StakingAnalytics } from '@/components/staking/StakingAnalytics';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export function StakingPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-4xl font-bold mb-8">Staking</h1>
        <StakingDashboard />
        <StakingAnalytics />
      </div>
    </DashboardLayout>
  );
} 