'use client';

import { useState, useEffect } from 'react';
import { OnRampComparison } from '@/components/OnRampComparison';
import { onRampService } from '@/services/onRampService';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';

export default function OnRampPage() {
  const { address, connect } = useWallet();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const handleProviderSelect = (providerId: string) => {
    if (!address) {
      connect();
      return;
    }
    setSelectedProviderId(providerId);
  };

  const handleContinueToProvider = () => {
    if (!isBrowser || !selectedProviderId) return;
    const provider = onRampService.getProviders().find(p => p.id === selectedProviderId);
    if (provider?.website) {
      window.open(provider.website, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Buy Crypto</h1>
          {!address && (
            <Button onClick={connect}>Connect Wallet</Button>
          )}
        </div>

        <div className="prose max-w-none">
          <p>
            Compare rates and fees from different providers to buy crypto with fiat currency.
            We support multiple payment methods and providers to ensure you get the best deal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Compare Providers</h2>
            <OnRampComparison onProviderSelect={handleProviderSelect} />
          </div>

          {selectedProviderId && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Selected Provider</h2>
              <div className="space-y-4">
                <p>
                  You selected {onRampService.getProviders().find(p => p.id === selectedProviderId)?.name}.
                  Click the button below to proceed with your purchase.
                </p>
                <Button onClick={handleContinueToProvider}>
                  Continue to Provider
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 