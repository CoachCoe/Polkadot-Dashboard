import React from 'react';
import { Referendum } from '@/services/governance';
import { Card } from '@/components/ui/Card';

interface ReferendumListProps {
  referenda: Referendum[];
  isLoading: boolean;
}

export function ReferendumList({ referenda, isLoading }: ReferendumListProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (referenda.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No active referenda found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {referenda.map((referendum) => (
        <Card key={referendum.index} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {referendum.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {referendum.description}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Track {referendum.track}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                Status: {referendum.status}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ayes</p>
              <p className="text-base font-medium text-green-600">
                {referendum.tally.ayes}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nays</p>
              <p className="text-base font-medium text-red-600">
                {referendum.tally.nays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Support</p>
              <p className="text-base font-medium">
                {referendum.tally.support}
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Submitted at: {new Date(parseInt(referendum.submittedAt) * 1000).toLocaleString()}
          </div>
        </Card>
      ))}
    </div>
  );
} 