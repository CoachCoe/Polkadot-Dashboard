import React, { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { PolkadotHubError } from '@/utils/errorHandling';

// Add type declaration for injectedWeb3
declare global {
  interface Window {
    injectedWeb3?: Record<string, unknown>;
  }
}

export function WalletConnect() {
  const { selectedAccount, connect: connectWallet, disconnect: disconnectWallet, isConnecting, error: walletError } = useWalletStore();
  const { connect: connectAuth, disconnect: disconnectAuth, isAuthenticated } = useAuthContext();
  const [status, setStatus] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Simple extension check
  useEffect(() => {
    const checkExtension = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const { web3Enable } = await import('@polkadot/extension-dapp');
        const extensions = await web3Enable('Polkadot Dashboard');
        if (extensions.length === 0) {
          setStatus('Please install Polkadot.js extension');
        }
      } catch (err) {
        console.error('Extension check failed:', err);
        setStatus('Failed to detect extension');
      }
    };

    checkExtension();
  }, []);

  // Clear status when account changes
  useEffect(() => {
    if (!isConnecting && !isDisconnecting) {
      setStatus('');
    }
  }, [selectedAccount, isConnecting, isDisconnecting]);

  const handleConnect = async () => {
    try {
      setStatus('Connecting wallet...');
      
      // Step 1: Connect wallet
      await connectWallet();
      
      // Step 2: Short delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Connect auth if wallet connected successfully
      if (selectedAccount) {
        setStatus('Authenticating...');
        await connectAuth();
        setStatus('Connected');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(error instanceof PolkadotHubError ? error.userMessage : 'Connection failed');
      throw error;
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setStatus('Disconnecting...');

      // First attempt to disconnect auth
      try {
        await disconnectAuth();
      } catch (err) {
        console.warn('Auth disconnect error:', err);
        // Continue with wallet disconnect even if auth disconnect fails
      }

      // Then disconnect wallet
      await disconnectWallet();
      setStatus('');
    } catch (err) {
      console.error('Disconnect error:', err);
      setStatus('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (walletError) {
    return (
      <div className="flex items-center space-x-4">
        <p className="text-red-600 text-sm font-medium">
          {walletError instanceof PolkadotHubError ? walletError.userMessage : 'Wallet error'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          Refresh
        </Button>
      </div>
    );
  }

  if (selectedAccount) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {selectedAccount.name || selectedAccount.address.slice(0, 6) + '...' + selectedAccount.address.slice(-4)}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </Button>
        {status && (
          <span className="text-sm text-gray-500">{status}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={handleConnect}
        disabled={isConnecting || status === 'Please install Polkadot.js extension'}
        variant="primary"
        size="sm"
        className="text-sm bg-pink-600 hover:bg-pink-700 text-white"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {status && (
        <span className="text-sm text-gray-500">{status}</span>
      )}
      {status === 'Please install Polkadot.js extension' && (
        <a
          href="https://polkadot.js.org/extension/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 text-sm font-medium"
        >
          Install Extension
        </a>
      )}
    </div>
  );
} 