'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useWalletStore } from '@/store/useWalletStore';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

// Create a client-only version of the component
const WalletConnectClient = () => {
  const { selectedAccount, connect, disconnect, isConnecting, error, clearError } = useWalletStore();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      // Error is already handled in the store
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {error && (
        <ErrorDisplay
          error={error}
          action={{
            label: 'Dismiss',
            onClick: clearError
          }}
        />
      )}
      
      {selectedAccount ? (
        <button
          onClick={disconnect}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#E6007A] hover:bg-[#FF1A8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E6007A] disabled:opacity-50"
          disabled={isConnecting}
        >
          {selectedAccount.name || selectedAccount.address.slice(0, 6) + '...' + selectedAccount.address.slice(-4)}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#E6007A] hover:bg-[#FF1A8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E6007A] disabled:opacity-50"
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

// Export a dynamic version that only renders on client
export const WalletConnect = dynamic(() => Promise.resolve(WalletConnectClient), {
  ssr: false,
}); 