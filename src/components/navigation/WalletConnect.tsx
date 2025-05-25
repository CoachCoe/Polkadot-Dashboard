import React, { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { PolkadotHubError } from '@/utils/errorHandling';

export function WalletConnect() {
  const { selectedAccount, connect: connectWallet, isConnecting: walletConnecting, error: walletError } = useWalletStore();
  const { isLoading: authLoading, error: authError, connect: connectAuth, disconnect: disconnectAuth } = useAuthContext();
  const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null);
  const [checkingExtension, setCheckingExtension] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  useEffect(() => {
    // Check for Polkadot.js extension
    const checkExtension = async () => {
      try {
        setCheckingExtension(true);
        setConnectionStatus('Checking for wallet extension...');
        
        // Use dynamic import with error boundary
        const extensionDapp = await import('@polkadot/extension-dapp').catch((err) => {
          console.error('Failed to load extension-dapp:', err);
          return null;
        });

        if (!extensionDapp) {
          setExtensionDetected(false);
          setConnectionStatus('Extension not found');
          return;
        }

        const extensions = await extensionDapp.web3Enable('Polkadot Dashboard');
        setExtensionDetected(extensions.length > 0);
        setConnectionStatus(extensions.length > 0 ? '' : 'No extension found');
      } catch (err) {
        console.error('Failed to detect wallet extension:', err);
        setExtensionDetected(false);
        setConnectionStatus('Failed to detect extension');
      } finally {
        setCheckingExtension(false);
      }
    };

    void checkExtension();
  }, []);

  const handleConnect = async () => {
    try {
      setConnectionStatus('Connecting wallet...');
      
      // First check if extension is enabled
      const extensionDapp = await import('@polkadot/extension-dapp');
      const extensions = await extensionDapp.web3Enable('Polkadot Dashboard');
      
      if (extensions.length === 0) {
        throw new PolkadotHubError(
          'No wallet extension found',
          'WALLET_NOT_FOUND',
          'Please install the Polkadot.js extension or another compatible wallet.'
        );
      }

      // Then connect the wallet
      await connectWallet();
      
      // Wait for the wallet state to update and verify connection
      let retries = 5;
      while (retries > 0 && !selectedAccount) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
      }
      
      if (!selectedAccount) {
        throw new PolkadotHubError(
          'Wallet connection failed',
          'WALLET_CONNECTION_ERROR',
          'Please try connecting your wallet again.'
        );
      }
      
      setConnectionStatus('Authenticating...');
      await connectAuth();
      
      setConnectionStatus('');
    } catch (err) {
      console.error('Connection error:', err);
      if (err instanceof PolkadotHubError) {
        setConnectionStatus(err.message);
      } else {
        setConnectionStatus('Failed to connect wallet');
      }
      // Error will be displayed through error state
    }
  };

  const handleDisconnect = async () => {
    try {
      setConnectionStatus('Disconnecting...');
      await disconnectAuth();
      setConnectionStatus('');
    } catch (err) {
      console.error('Disconnection error:', err);
      setConnectionStatus('Failed to disconnect');
    }
  };

  if (checkingExtension) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          disabled
          variant="outline"
          size="sm"
          className="text-sm"
        >
          Checking Extension...
        </Button>
      </div>
    );
  }

  if (extensionDetected === false) {
    return (
      <div className="flex items-center space-x-4">
        <a
          href="https://polkadot.js.org/extension/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 text-sm font-medium"
        >
          Install Polkadot.js Extension
        </a>
        <Button
          onClick={() => {
            setCheckingExtension(true);
            setExtensionDetected(null);
            setConnectionStatus('Retrying extension check...');
          }}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  const error = walletError || authError;
  if (error) {
    return (
      <div className="flex items-center space-x-4">
        <p className="text-red-600 text-sm font-medium">
          {error instanceof PolkadotHubError ? error.message : 'Failed to connect wallet'}
        </p>
        <Button
          onClick={() => {
            setConnectionStatus('Retrying...');
            window.location.reload();
          }}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (selectedAccount) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-gray-700">
            {selectedAccount.name || selectedAccount.address.slice(0, 6) + '...' + selectedAccount.address.slice(-4)}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          disabled={authLoading || walletConnecting}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          {authLoading || walletConnecting ? 'Disconnecting...' : 'Disconnect'}
        </Button>
        {connectionStatus && (
          <span className="text-sm text-gray-500">{connectionStatus}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={handleConnect}
        disabled={walletConnecting || authLoading || extensionDetected === null}
        variant="primary"
        size="sm"
        className="text-sm bg-pink-600 hover:bg-pink-700 text-white"
      >
        {walletConnecting || authLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {connectionStatus && (
        <span className="text-sm text-gray-500">{connectionStatus}</span>
      )}
    </div>
  );
} 