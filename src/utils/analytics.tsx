'use client';

import { Analytics } from '@vercel/analytics/react';
import { type ReactNode } from 'react';

interface AnalyticsWrapperProps {
  children: ReactNode;
}

export function AnalyticsWrapper({ children }: AnalyticsWrapperProps): JSX.Element {
  const isProduction = process.env.NODE_ENV === 'production';
  const analyticsId = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;

  if (!isProduction || !analyticsId) {
    return <>{children}</>;
  }

  return (
    <>
      <Analytics
        beforeSend={(event) => {
          if (!isProduction) {
            return null;
          }
          return event;
        }}
      />
      {children}
    </>
  );
} 