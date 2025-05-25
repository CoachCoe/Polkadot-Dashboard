import React, { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { PolkadotHubError } from '@/utils/errorHandling';

export function WalletConnect() {
  const { selectedAccount, isConnecting: walletConnecting, error: walletError } = useWalletStore();
  const { isLoading: authLoading, error: authError, connect, disconnect } = useAuthContext();
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
        setConnectionStatus(extensions.length > 0 ? 'Extension ready' : 'No extension found');
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
      setConnectionStatus('Connecting to wallet...');
      await connect();
      setConnectionStatus('Connected successfully');
    } catch (err) {
      console.error('Connection error:', err);
      setConnectionStatus(err instanceof PolkadotHubError ? err.message : 'Connection failed');
    }
  };

  const handleDisconnect = async () => {
    try {
      setConnectionStatus('Disconnecting...');
      await disconnect();
      setConnectionStatus('Disconnected');
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
          className="text-sm"
        >
          Checking Extension...
        </Button>
        <span className="text-sm text-gray-500">{connectionStatus}</span>
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
          className="text-pink-600 hover:text-pink-700 text-sm"
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
          className="text-sm"
        >
          Retry
        </Button>
        <span className="text-sm text-gray-500">{connectionStatus}</span>
      </div>
    );
  }

  const error = walletError || authError;
  if (error) {
    return (
      <div className="flex items-center space-x-4">
        <p className="text-red-600 text-sm">
          {error instanceof PolkadotHubError ? error.message : 'Failed to connect wallet'}
        </p>
        <Button
          onClick={() => {
            setConnectionStatus('Retrying...');
            window.location.reload();
          }}
          variant="outline"
          className="text-sm"
        >
          Retry
        </Button>
        <span className="text-sm text-gray-500">{connectionStatus}</span>
      </div>
    );
  }

  if (selectedAccount) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-gray-700">
          {selectedAccount.name || selectedAccount.address.slice(0, 6) + '...' + selectedAccount.address.slice(-4)}
        </span>
        <Button
          onClick={handleDisconnect}
          disabled={authLoading}
          variant="outline"
          className="text-sm"
        >
          {authLoading ? 'Disconnecting...' : 'Disconnect'}
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
        className="text-sm"
      >
        {walletConnecting || authLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {connectionStatus && (
        <span className="text-sm text-gray-500">{connectionStatus}</span>
      )}
    </div>
  );
} 