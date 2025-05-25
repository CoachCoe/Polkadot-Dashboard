import React, { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { PolkadotHubError } from '@/utils/errorHandling';
import { ErrorCodes } from '@/utils/errorHandling';

// Add type declaration for injectedWeb3
declare global {
  interface Window {
    injectedWeb3?: Record<string, unknown>;
  }
}

export function WalletConnect() {
  const { selectedAccount, connect: connectWallet, isConnecting: walletConnecting, error: walletError, clearError } = useWalletStore();
  const { isLoading: authLoading, error: authError, connect: connectAuth, disconnect: disconnectAuth } = useAuthContext();
  const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null);
  const [checkingExtension, setCheckingExtension] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let extensionCheckInterval: NodeJS.Timeout;

    // Check for Polkadot.js extension
    const checkExtension = async () => {
      try {
        if (!mounted) return;
        setCheckingExtension(true);
        setConnectionStatus('Checking for wallet extension...');
        
        // Wait for window.injectedWeb3 to be available with a longer timeout
        const waitForInjectedWeb3 = async (timeout = 5000) => {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            if (window.injectedWeb3 && Object.keys(window.injectedWeb3).length > 0) {
              return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return false;
        };

        // First check if injectedWeb3 is already available
        const hasInjectedWeb3 = await waitForInjectedWeb3();
        
        if (!hasInjectedWeb3) {
          if (mounted) {
            setExtensionDetected(false);
            setConnectionStatus('Extension not found');
          }
          return;
        }

        // Use dynamic import with error boundary and retry
        const loadExtensionDapp = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            try {
              return await import('@polkadot/extension-dapp');
            } catch (err) {
              console.warn(`Failed to load extension-dapp (attempt ${i + 1}/${retries}):`, err);
              if (i === retries - 1) throw err;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          throw new Error('Failed to load extension-dapp after retries');
        };

        const extensionDapp = await loadExtensionDapp();

        if (!extensionDapp || !mounted) {
          setExtensionDetected(false);
          setConnectionStatus('Extension not found');
          return;
        }

        const extensions = await extensionDapp.web3Enable('Polkadot Dashboard');
        if (mounted) {
          setExtensionDetected(extensions.length > 0);
          setConnectionStatus(extensions.length > 0 ? '' : 'No extension found');
        }
      } catch (err) {
        console.error('Failed to detect wallet extension:', err);
        if (mounted) {
          setExtensionDetected(false);
          setConnectionStatus('Failed to detect extension');
        }
      } finally {
        if (mounted) {
          setCheckingExtension(false);
        }
      }
    };

    // Start checking for extension
    void checkExtension();

    // Set up periodic checks if extension is not found
    extensionCheckInterval = setInterval(() => {
      if (!extensionDetected) {
        void checkExtension();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      mounted = false;
      clearInterval(extensionCheckInterval);
    };
  }, [extensionDetected]);

  const handleConnect = async () => {
    try {
      if (retryCount >= 3) {
        throw new PolkadotHubError(
          'Maximum connection attempts reached',
          ErrorCodes.WALLET.CONNECTION_ERROR,
          'Please refresh the page and try again.'
        );
      }

      clearError(); // Clear any previous errors
      setConnectionStatus('Checking wallet extension...');
      
      // Wait for extension to be ready with a longer timeout
      const waitForExtension = async (timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (window.injectedWeb3 && Object.keys(window.injectedWeb3).length > 0) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return false;
      };

      const extensionReady = await waitForExtension();
      if (!extensionReady) {
        throw new PolkadotHubError(
          'Wallet extension not found',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please install the Polkadot.js extension and refresh the page.'
        );
      }

      setConnectionStatus('Enabling wallet access...');
      
      // Load extension-dapp with retries
      const extensionDapp = await import('@polkadot/extension-dapp');
      const extensions = await extensionDapp.web3Enable('Polkadot Dashboard');
      
      if (!extensions || extensions.length === 0) {
        throw new PolkadotHubError(
          'No wallet extension enabled',
          ErrorCodes.WALLET.ACCESS_DENIED,
          'Please allow access to your wallet when prompted.'
        );
      }

      // Check if accounts are available before proceeding
      const accounts = await extensionDapp.web3Accounts();
      if (!accounts || accounts.length === 0) {
        throw new PolkadotHubError(
          'No accounts available',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'Please create or import an account in your wallet extension.'
        );
      }

      setConnectionStatus('Connecting wallet...');
      setRetryCount(prev => prev + 1);
      
      // Connect wallet with timeout
      const connectWithTimeout = async (timeout = 20000) => {
        return Promise.race([
          connectWallet(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new PolkadotHubError(
              'Wallet connection timeout',
              ErrorCodes.WALLET.CONNECTION_ERROR,
              'The connection request timed out. Please check your wallet extension and try again.'
            )), timeout)
          )
        ]);
      };

      await connectWithTimeout();
      
      // Wait for the wallet state to update with a more generous timeout
      const waitForWalletConnection = async (timeout = 20000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (selectedAccount) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return false;
      };

      const connected = await waitForWalletConnection();
      if (!connected) {
        throw new PolkadotHubError(
          'Wallet connection timeout',
          ErrorCodes.WALLET.CONNECTION_ERROR,
          'The connection request timed out. Please check your wallet extension and try again.'
        );
      }

      setConnectionStatus('Authenticating...');
      await connectAuth();
      
      setConnectionStatus('');
      setRetryCount(0); // Reset retry count on successful connection
    } catch (error: unknown) {
      console.error('Connection error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message?.includes('No accounts available')) {
          setConnectionStatus('Please create or import an account in your wallet');
        } else if (error.message?.includes('Wallet extension not found')) {
          setConnectionStatus('Please install the Polkadot.js extension');
        } else if (error instanceof PolkadotHubError) {
          setConnectionStatus(error.userMessage || error.message);
        } else {
          setConnectionStatus('Failed to connect wallet. Please try again.');
        }
      }
      
      throw error;
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
          {error instanceof PolkadotHubError ? error.userMessage || error.message : 'Failed to connect wallet'}
        </p>
        <Button
          onClick={() => {
            clearError();
            setConnectionStatus('Retrying...');
            handleConnect();
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