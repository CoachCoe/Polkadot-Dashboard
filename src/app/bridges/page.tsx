import React from 'react';
import ClientOnly from '@/components/ClientOnly';
import { BridgesPage } from '@/components/bridges/BridgesPage';

export default function Page() {
  return (
    <ClientOnly>
      <BridgesPage />
    </ClientOnly>
  );
} 