import { web3Enable, web3Accounts, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedExtension, InjectedAccount } from '@polkadot/extension-inject/types';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

export interface WalletProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  supported: boolean;
  installed: boolean;
}

export interface WalletAccount extends InjectedAccount {
  provider: string;
  balance?: string;
  meta: {
    name?: string;
    source: string;
    genesisHash?: string | null;
  };
}

class WalletService {
  private static instance: WalletService;
  private providers: WalletProvider[] = [
    {
      id: 'polkadot-js',
      name: 'Polkadot.js',
      logo: '/images/wallets/polkadot-js.svg',
      description: 'Browser extension for interacting with Polkadot/Substrate chains',
      website: 'https://polkadot.js.org/extension/',
      supported: true,
      installed: false
    },
    {
      id: 'talisman',
      name: 'Talisman',
      logo: '/images/wallets/talisman.svg',
      description: 'A wallet built for Polkadot & Ethereum',
      website: 'https://talisman.xyz/',
      supported: true,
      installed: false
    },
    {
      id: 'subwallet',
      name: 'SubWallet',
      logo: '/images/wallets/subwallet.svg',
      description: 'A comprehensive Web3 wallet for Polkadot & Substrate',
      website: 'https://subwallet.app/',
      supported: true,
      installed: false
    },
    {
      id: 'fearless',
      name: 'Fearless Wallet',
      logo: '/images/wallets/fearless.svg',
      description: 'Mobile wallet for Polkadot & Kusama',
      website: 'https://fearlesswallet.io/',
      supported: true,
      installed: false
    }
  ];

  private extensions: InjectedExtension[] = [];
  private accounts: WalletAccount[] = [];
  private initialized = false;

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Enable all available extensions
      const extensions = await web3Enable('Polkadot Hub');
      this.extensions = extensions;

      // Update provider installation status
      this.providers = this.providers.map(provider => ({
        ...provider,
        installed: extensions.some(ext => 
          ext.name.toLowerCase().includes(provider.id.toLowerCase())
        )
      }));

      // Get all accounts from all extensions
      const accounts = await web3Accounts();
      this.accounts = accounts.map(account => ({
        ...account,
        provider: this.getProviderFromSource(account.meta.source)
      }));

      this.initialized = true;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to initialize wallet service',
        ErrorCodes.WALLET.EXTENSION_LOAD_ERROR,
        'Could not initialize wallet connections'
      );
    }
  }

  private getProviderFromSource(source: string): string {
    const provider = this.providers.find(p => 
      source.toLowerCase().includes(p.id.toLowerCase())
    );
    return provider?.id || source;
  }

  getProviders(): WalletProvider[] {
    return this.providers;
  }

  getAccounts(): WalletAccount[] {
    return this.accounts;
  }

  async getAccountSigner(address: string): Promise<any> {
    try {
      const injector = await web3FromAddress(address);
      if (!injector?.signer) {
        throw new PolkadotHubError(
          'No signer found',
          ErrorCodes.WALLET.NO_SIGNER,
          'No signer available for this account'
        );
      }
      return injector.signer;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to get signer',
        ErrorCodes.WALLET.SIGNER_ERROR,
        'Could not get signer for the account'
      );
    }
  }

  async subscribeToBalanceChanges(
    _address: string,
    _callback: (balance: string) => void
  ): Promise<() => void> {
    // TODO: Implement balance subscription
    return () => {};
  }

  async disconnect(): Promise<void> {
    this.accounts = [];
    this.extensions = [];
    this.initialized = false;
  }

  isConnected(): boolean {
    return this.initialized && this.extensions.length > 0;
  }

  hasAccounts(): boolean {
    return this.accounts.length > 0;
  }
}

export const walletService = WalletService.getInstance(); 