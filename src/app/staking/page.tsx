import React from 'react';
import ClientOnly from '@/components/ClientOnly';
import { StakingPage } from '@/components/staking/StakingPage';

export default function Page() {
  return (
    <ClientOnly>
      <StakingPage />
    </ClientOnly>
  );
} 