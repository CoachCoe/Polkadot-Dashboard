'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { governanceService, type Referendum } from '@/services/governance';
import { useWalletStore } from '@/store/useWalletStore';

export function ReferendumList() {
  const [referendums, setReferendums] = useState<Referendum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAccount } = useWalletStore();

  async function loadReferendums() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await governanceService.getReferenda();
      setReferendums(data);
    } catch (err) {
      console.error('Failed to load referendums:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referendums');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReferendums();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner className="w-8 h-8 mx-auto" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => void loadReferendums()}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (referendums.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600">No active referendums found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {referendums.map((referendum) => (
        <Card key={referendum.index} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{referendum.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{referendum.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium">{referendum.status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Track</p>
                  <p className="font-medium">{referendum.track}</p>
                </div>
                <div>
                  <p className="text-gray-600">Deposit</p>
                  <p className="font-medium">{referendum.deposit}</p>
                </div>
                <div>
                  <p className="text-gray-600">Proposer</p>
                  <p className="font-medium truncate" title={referendum.proposer}>
                    {referendum.proposer.slice(0, 8)}...{referendum.proposer.slice(-8)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Current Tally</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ayes</p>
                    <p className="font-medium">{referendum.tally.ayes}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Nays</p>
                    <p className="font-medium">{referendum.tally.nays}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Support</p>
                    <p className="font-medium">{referendum.tally.support}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedAccount && (
              <div className="ml-4">
                <Button 
                  variant="outline" 
                  className="w-full mb-2"
                  onClick={() => {
                    // TODO: Implement voting
                    console.log('Vote Aye for referendum', referendum.index);
                  }}
                >
                  Vote Aye
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement voting
                    console.log('Vote Nay for referendum', referendum.index);
                  }}
                >
                  Vote Nay
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
} 