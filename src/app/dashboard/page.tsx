import { Suspense } from 'react';
import { DashboardContent } from './DashboardContent';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6">
          <Card className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
} 