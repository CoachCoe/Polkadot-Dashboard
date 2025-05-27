import { Suspense } from 'react';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { TransactionHistory } from '@/components/dashboard/TransactionHistory';
import { StakingRewards } from '@/components/dashboard/StakingRewards';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <PortfolioOverview />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <StakingRewards />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-96" />}>
          <TransactionHistory />
        </Suspense>
      </div>
    </div>
  );
} 