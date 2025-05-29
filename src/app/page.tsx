import React from 'react';
import ClientOnly from '@/components/ClientOnly';
import { HomePage } from '@/components/home/HomePage';

export default function Page() {
  return (
    <ClientOnly>
      <HomePage />
    </ClientOnly>
  );
} 