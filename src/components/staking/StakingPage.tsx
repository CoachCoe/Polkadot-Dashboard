'use client';

import React from 'react';
import { StakingDashboard } from '@/components/staking/StakingDashboard';
import { StakingAnalytics } from '@/components/staking/StakingAnalytics';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export function StakingPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Staking</h1>
              <p className="mt-3 text-xl text-gray-600 max-w-2xl">
                Stake your DOT tokens to earn rewards and secure the network
              </p>
            </div>
          </div>
          <div className="space-y-8">
        <StakingDashboard />
        <StakingAnalytics />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 