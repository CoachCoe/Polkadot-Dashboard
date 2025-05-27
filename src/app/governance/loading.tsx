import { Card } from '@/components/ui/Card';

export default function GovernanceLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>

      <div className="space-y-6">
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
        
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-6 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </Card>
      </div>
    </div>
  );
} 