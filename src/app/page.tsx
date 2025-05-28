import React from 'react';
import ClientOnly from '@/components/ClientOnly';
import { PortfolioPage } from '@/components/portfolio/PortfolioPage';

export default function Page() {
  return (
    <ClientOnly>
      <PortfolioPage />
    </ClientOnly>
  );
} 