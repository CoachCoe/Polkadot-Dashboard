import React from 'react';
import ClientOnly from '@/components/ClientOnly';
import { BridgePage } from '@/components/bridge/BridgePage';

export default function Page() {
  return (
    <ClientOnly>
      <BridgePage />
    </ClientOnly>
  );
} 