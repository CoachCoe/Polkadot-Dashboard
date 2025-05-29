import { web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedExtension, InjectedAccount, Unsubcall, InjectedWindowProvider } from '@polkadot/extension-inject/types';
import type { SignerPayloadJSON, SignerResult } from '@polkadot/types/types/extrinsic';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { HexString } from '@polkadot/util/types';
import { default as TransportWebUSB } from '@ledgerhq/hw-transport-webusb';

// Define MetaMask interface
interface MetaMaskEthereum {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress: string | null;
  chainId: string;
}

// Augment the window interface
declare global {
  interface Window {
    ethereum?: MetaMaskEthereum;
    injectedWeb3?: Record<string, InjectedWindowProvider>;
  }
}

export interface WalletProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  supported: boolean;
  installed: boolean | Promise<boolean>;
}

export interface WalletAccount extends Omit<InjectedAccount, 'meta'> {
  provider: string;
  balance?: string;
  meta: {
    name?: string;
    source: string;
    genesisHash?: string | null;
  };
}

export class WalletService {
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
      id: 'metamask',
      name: 'MetaMask',
      logo: '/images/wallets/metamask.svg',
      description: 'The most popular Web3 wallet with Polkadot support',
      website: 'https://metamask.io/',
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
      id: 'ledger',
      name: 'Ledger',
      logo: '/images/wallets/ledger.svg',
      description: 'Secure hardware wallet with Polkadot support',
      website: 'https://www.ledger.com/',
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
      id: 'fearless',
      name: 'Fearless Wallet',
      logo: '/images/wallets/fearless.svg',
      description: 'Mobile wallet for Polkadot & Kusama',
      website: 'https://fearlesswallet.io/',
      supported: true,
      installed: false
    }
  ];

  private accounts: InjectedAccount[] = [];
  private unsubscribeCallback: Unsubcall | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  private getInjectedWeb3(): Record<string, InjectedWindowProvider> | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.injectedWeb3;
  }

  private async detectMetaMask(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!(window as { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask;
  }

  private async detectLedger(): Promise<boolean> {
    try {
      const isSupported = await TransportWebUSB.isSupported();
      return isSupported;
    } catch (error) {
      console.warn('Ledger detection failed:', error);
      return false;
    }
  }

  private async initializeMetaMask(): Promise<InjectedExtension[]> {
    if (!await this.detectMetaMask()) {
      throw new PolkadotHubError(
        'MetaMask not found',
        ErrorCodes.WALLET.EXTENSION_NOT_AVAILABLE,
        'Please install MetaMask to use this feature.'
      );
    }

    const ethereum = window.ethereum!;
    await ethereum.request({ method: 'eth_requestAccounts' });
    
    const metaMaskExtension: InjectedExtension = {
      name: 'metamask',
      version: '1.0.0',
      accounts: {
        get: async () => {
          const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
          return accounts.map((address: string): WalletAccount => ({
            address,
            type: 'ethereum',
            provider: 'metamask',
            meta: {
              name: 'MetaMask Account',
              source: 'metamask'
            }
          }));
        },
        subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>): Unsubcall => {
          const handle = setInterval(async () => {
            const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
            void cb(accounts.map((address: string): WalletAccount => ({
              address,
              type: 'ethereum',
              provider: 'metamask',
              meta: {
                name: 'MetaMask Account',
                source: 'metamask'
              }
            })));
          }, 1000);
          return () => clearInterval(handle);
        }
      },
      signer: {
        signPayload: async (payload: SignerPayloadJSON): Promise<SignerResult> => {
          const signature = await ethereum.request({
            method: 'eth_sign',
            params: [payload.address, payload.method]
          });
          return { 
            id: 0,
            signature: signature as HexString
          };
        }
      }
    };

    return [metaMaskExtension];
  }

  private async initializeLedger(): Promise<InjectedExtension[]> {
    if (!await this.detectLedger()) {
      throw new PolkadotHubError(
        'Ledger not detected',
        ErrorCodes.WALLET.EXTENSION_NOT_AVAILABLE,
        'Please connect your Ledger device and ensure it is unlocked.'
      );
    }

    try {
      const { default: TransportWebUSB } = await import('@ledgerhq/hw-transport-webusb');
      const { default: Eth } = await import('@ledgerhq/hw-app-eth');
      
      const transport = await TransportWebUSB.create();
      const eth = new Eth(transport);

      const ledgerExtension: InjectedExtension = {
        name: 'ledger',
        version: '1.0.0',
        accounts: {
          get: async () => {
            const { address } = await eth.getAddress("44'/60'/0'/0/0");
            return [{
              address,
              type: 'ethereum',
              provider: 'ledger',
              meta: {
                name: 'Ledger Account',
                source: 'ledger'
              }
            } as WalletAccount];
          },
          subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>): Unsubcall => {
            void eth.getAddress("44'/60'/0'/0/0").then(({ address }) => {
              void cb([{
                address,
                type: 'ethereum',
                provider: 'ledger',
                meta: {
                  name: 'Ledger Account',
                  source: 'ledger'
                }
              } as WalletAccount]);
            });
            return () => {};
          }
        },
        signer: {
          signPayload: async (_payload: SignerPayloadJSON): Promise<SignerResult> => {
            // TODO: Implement proper Ledger signing
            throw new PolkadotHubError(
              'Ledger signing not implemented',
              ErrorCodes.WALLET.SIGNER_ERROR,
              'Ledger hardware wallet signing is not yet implemented.'
            );
          }
        }
      };

      return [ledgerExtension];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to initialize Ledger',
        ErrorCodes.WALLET.EXTENSION_LOAD_ERROR,
        'Could not connect to Ledger device. Please ensure it is connected and unlocked.'
      );
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      let extensions: InjectedExtension[] = [];

      // Initialize Polkadot.js and other injected extensions
      const injectedWeb3 = this.getInjectedWeb3();
      if (injectedWeb3) {
        const web3Extensions = Object.values(injectedWeb3);
        if (web3Extensions.length > 0) {
          const enablePromises = web3Extensions.map(extension => 
            extension.enable?.('Polkadot Hub').catch(error => {
              console.warn(`Failed to enable extension: ${error.message}`);
              return null;
            })
          );

          const enabledWeb3Extensions = (await Promise.all(enablePromises))
            .filter((ext): ext is InjectedExtension => ext !== null);
          extensions = extensions.concat(enabledWeb3Extensions);
        }
      }

      // Initialize MetaMask if available
      try {
        const metaMaskExtensions = await this.initializeMetaMask();
        extensions = extensions.concat(metaMaskExtensions);
      } catch (error) {
        console.warn('MetaMask initialization failed:', error);
      }

      // Initialize Ledger if available
      try {
        const ledgerExtensions = await this.initializeLedger();
        extensions = extensions.concat(ledgerExtensions);
      } catch (error) {
        console.warn('Ledger initialization failed:', error);
      }

      if (extensions.length === 0) {
        throw new PolkadotHubError(
          'No extensions enabled',
          ErrorCodes.WALLET.EXTENSION_LOAD_ERROR,
          'No wallet extensions were enabled'
        );
      }

      // Get accounts from all enabled extensions
      const accountPromises = extensions.map(extension =>
        extension.accounts.get().catch(error => {
          console.warn(`Failed to get accounts from extension: ${error.message}`);
          return [];
        })
      );

      const accountArrays = await Promise.all(accountPromises);
      this.accounts = accountArrays.flat();

      // Set up account change subscription for the first extension that supports it
      for (const extension of extensions) {
        if (typeof extension.accounts.subscribe === 'function') {
          this.unsubscribeCallback = await extension.accounts.subscribe((newAccounts: InjectedAccount[]) => {
            this.accounts = newAccounts;
          });
          break;
        }
      }

      this.isInitialized = true;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to initialize wallet',
        ErrorCodes.WALLET.EXTENSION_LOAD_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
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
    return this.accounts.map(account => {
      const walletAccount = account as unknown as WalletAccount;
      if (walletAccount.meta?.source) {
        walletAccount.meta.source = this.getProviderFromSource(walletAccount.meta.source);
      }
      return walletAccount;
    });
  }

  async signPayload(address: string, payload: SignerPayloadJSON): Promise<SignerResult> {
    try {
      const injector = await web3FromAddress(address);
      if (!injector?.signer?.signPayload) {
        throw new PolkadotHubError(
          'No signer found',
          ErrorCodes.WALLET.NO_SIGNER,
          'No signer found for this address'
        );
      }
      return await injector.signer.signPayload(payload);
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to sign payload',
        ErrorCodes.WALLET.SIGNER_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
      this.unsubscribeCallback = null;
    }
    this.accounts = [];
    this.isInitialized = false;
  }

  isConnected(): boolean {
    return this.isInitialized && this.accounts.length > 0;
  }

  hasAccounts(): boolean {
    return this.accounts.length > 0;
  }
}

export const walletService = WalletService.getInstance(); 