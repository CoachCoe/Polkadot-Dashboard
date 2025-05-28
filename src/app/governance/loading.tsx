'use client';

import { Card } from '@/components/ui/Card';

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
        </Card>
        
        <Card>
          <div className="p-4 border-b">
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-16 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-16 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 