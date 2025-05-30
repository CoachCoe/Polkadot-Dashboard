'use client';

import React from 'react';
import { StakingDashboard } from '@/components/staking/StakingDashboard';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export function StakingPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Stake Your</span>
                    <span className="block text-pink-600">DOT Tokens</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Earn rewards while helping secure the Polkadot network. Choose from a variety of validators or join a nomination pool to start staking today.
                  </p>
                </div>
              </main>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="h-56 w-full bg-gradient-to-r from-pink-500 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full" />
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-8">
            <StakingDashboard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 