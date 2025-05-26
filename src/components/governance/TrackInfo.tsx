import React from 'react';
import { Track } from '@/services/governance';
import { Card } from '@/components/ui/Card';

interface TrackInfoProps {
  track: Track;
}

export function TrackInfo({ track }: TrackInfoProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{track.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{track.description}</p>
        </div>
        <span className="text-sm text-gray-500">Track {track.id}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Minimum Deposit</p>
          <p className="text-base font-medium">{track.minDeposit}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Decision Period</p>
          <p className="text-base font-medium">{track.decisionPeriod} blocks</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Prepare Period</p>
          <p className="text-base font-medium">{track.preparePeriod} blocks</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Deciding Period</p>
          <p className="text-base font-medium">{track.decidingPeriod} blocks</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Confirm Period</p>
          <p className="text-base font-medium">{track.confirmPeriod} blocks</p>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Approval Requirements</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Min Approval</p>
            <p className="text-base font-medium">{track.minApproval}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Min Support</p>
            <p className="text-base font-medium">{track.minSupport}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
} 