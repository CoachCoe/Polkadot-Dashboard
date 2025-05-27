import { ApiPromise } from '@polkadot/api';
import { polkadotService } from './polkadot';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { AddressOrPair } from '@polkadot/api/types';
import { formatBalance } from '@/utils/formatters';

export interface BridgeProvider {
  id: string;
  name: string;
  description: string;
  supportedChains: string[];
  minimumAmount: string;
  maximumAmount: string;
  estimatedTime: string;
  fee: string;
  isThirdParty?: boolean;
  website?: string;
  documentation?: string;
}

export interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash: string;
  bridgeProvider: string;
}

export interface OnRampProvider {
  id: string;
  name: string;
  description: string;
  supportedFiatCurrencies: string[];
  supportedCryptos: string[];
  minimumAmount: string;
  maximumAmount: string;
  fees: string;
  kycRequired: boolean;
  estimatedTime: string;
}

export interface BridgeQuote {
  amount: string;
  fee: string;
  estimatedTime: string;
  route: string[];
  provider: string;
  expectedOutput: string;
}

export interface OnRampQuote {
  provider: string;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoCurrency: string;
  cryptoAmount: string;
  rate: string;
  fee: string;
  total: string;
}

interface XcmTransferParams {
  destChain: string;
  destAddress: string;
  amount: string;
}

class BridgeService {
  private static instance: BridgeService;
  private api: ApiPromise | null = null;

  private bridgeProviders: BridgeProvider[] = [
    {
      id: 'xcm',
      name: 'XCM Transfer',
      description: 'Native cross-chain messaging for Polkadot ecosystem',
      supportedChains: ['asset-hub', 'acala', 'astar', 'moonbeam'],
      minimumAmount: '1',
      maximumAmount: '10000',
      estimatedTime: '2-5 minutes',
      fee: '0.5',
      isThirdParty: false,
      documentation: 'https://wiki.polkadot.network/docs/learn-xcm'
    },
    {
      id: 'wormhole',
      name: 'Wormhole',
      description: 'Secure and fast cross-chain bridge',
      supportedChains: ['polkadot', 'ethereum', 'solana', 'binance-smart-chain'],
      minimumAmount: '10',
      maximumAmount: '1000000',
      estimatedTime: '15-20 minutes',
      fee: '0.1%',
      isThirdParty: true,
      website: 'https://wormhole.com',
      documentation: 'https://docs.wormhole.com'
    },
    {
      id: 'multichain',
      name: 'Multichain',
      description: 'Cross-chain router protocol',
      supportedChains: ['polkadot', 'ethereum', 'binance-smart-chain'],
      minimumAmount: '50',
      maximumAmount: '500000',
      estimatedTime: '10-30 minutes',
      fee: '0.3%',
      isThirdParty: true,
      website: 'https://multichain.org',
      documentation: 'https://docs.multichain.org'
    }
  ];

  private onRampProviders: OnRampProvider[] = [
    {
      id: 'moonpay',
      name: 'MoonPay',
      description: 'Buy crypto with credit card or bank transfer',
      supportedFiatCurrencies: ['USD', 'EUR', 'GBP'],
      supportedCryptos: ['DOT'],
      minimumAmount: '30',
      maximumAmount: '50000',
      fees: '4.5%',
      kycRequired: true,
      estimatedTime: '5-10 minutes'
    },
    {
      id: 'banxa',
      name: 'Banxa',
      description: 'Global fiat on-ramp solution',
      supportedFiatCurrencies: ['USD', 'EUR', 'GBP', 'AUD'],
      supportedCryptos: ['DOT'],
      minimumAmount: '50',
      maximumAmount: '100000',
      fees: '2.5%',
      kycRequired: true,
      estimatedTime: '10-30 minutes'
    }
  ];

  private constructor() {}

  static getInstance(): BridgeService {
    if (!BridgeService.instance) {
      BridgeService.instance = new BridgeService();
    }
    return BridgeService.instance;
  }

  async getApi(): Promise<ApiPromise> {
    if (!this.api) {
      this.api = await polkadotService.getApi();
    }
    return this.api;
  }

  getBridgeProviders(): BridgeProvider[] {
    return this.bridgeProviders;
  }

  getOnRampProviders(): OnRampProvider[] {
    return this.onRampProviders;
  }

  private async getXcmTransferTx({ destChain, destAddress, amount }: XcmTransferParams) {
    const api = await polkadotService.getApi();
    if (!api?.tx?.xcmPallet?.reserveTransferAssets) {
      throw new PolkadotHubError(
        'XCM transfer not available',
        ErrorCodes.API.ERROR,
        'XCM transfer functionality is not available on this chain.'
      );
    }

    // Get parachain ID for destination chain
    const parachainId = this.getParachainId(destChain);
    if (!parachainId) {
      throw new PolkadotHubError(
        'Invalid destination chain',
        ErrorCodes.BRIDGE.ERROR,
        'The selected destination chain is not supported.'
      );
    }

    // Construct XCM message
    const transferCall = api.tx.xcmPallet.reserveTransferAssets(
      { V3: { parents: 0, interior: { X1: { ParaChain: parachainId } } } }, // destination
      { V3: { parents: 0, interior: { X1: { AccountId32: { network: 'Any', id: destAddress } } } } }, // beneficiary
      { V3: [{ id: { Concrete: { parents: 0, interior: 'Here' } }, fun: { Fungible: amount } }] }, // assets
      0 // fee index
    );

    return transferCall;
  }

  private getParachainId(chain: string): number | null {
    const parachainIds: Record<string, number> = {
      'asset-hub': 1000,
      'acala': 2000,
      'astar': 2006,
      'moonbeam': 2004
    };
    return parachainIds[chain] || null;
  }

  async getBridgeQuote(
    fromChain: string,
    toChain: string,
    amount: string,
    providerId?: string
  ): Promise<BridgeQuote> {
    try {
      const availableProviders = this.bridgeProviders.filter(p => 
        p.supportedChains.includes(fromChain) && 
        p.supportedChains.includes(toChain)
      );

      if (availableProviders.length === 0) {
        throw new PolkadotHubError(
          'Bridge route not available',
          ErrorCodes.BRIDGE.UNAVAILABLE,
          'No available bridge route between the selected chains'
        );
      }

      const provider = providerId 
        ? availableProviders.find(p => p.id === providerId)
        : availableProviders[0];

      if (!provider) {
        throw new PolkadotHubError(
          'Invalid bridge provider',
          ErrorCodes.BRIDGE.UNAVAILABLE,
          'The selected bridge provider is not available'
        );
      }

      if (provider.id === 'xcm') {
        const api = await polkadotService.getApi();
        if (!api) throw new Error('API not initialized');

        // Get XCM transfer fee estimation
        const dummyAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice's address for estimation
        const transferTx = await this.getXcmTransferTx({
          destChain: toChain,
          destAddress: dummyAddress,
          amount
        });

        const info = await transferTx.paymentInfo(dummyAddress);
        const fee = info.partialFee.toString();

        return {
          amount,
          fee: formatBalance(fee),
          estimatedTime: provider.estimatedTime,
          route: [fromChain, toChain],
          provider: provider.name,
          expectedOutput: formatBalance((BigInt(amount) - BigInt(fee)).toString())
        };
      }

      // For third-party bridges, return their standard fees
      return {
        amount,
        fee: provider.fee,
        estimatedTime: provider.estimatedTime,
        route: [fromChain, toChain],
        provider: provider.name,
        expectedOutput: amount // This would be calculated based on provider's rates
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to get bridge quote',
        ErrorCodes.BRIDGE.ESTIMATE_ERROR,
        error instanceof Error ? error.message : 'Error getting bridge transfer quote'
      );
    }
  }

  async getTransactionHistory(_address: string): Promise<BridgeTransaction[]> {
    try {
      // TODO: Implement actual transaction history fetching
      // This would typically involve:
      // 1. Querying on-chain events
      // 2. Querying third-party bridge APIs
      // 3. Combining and formatting the results
      
      // For now, return mock data
      return [
        {
          id: '1',
          fromChain: 'Polkadot',
          toChain: 'Ethereum',
          amount: '100 DOT',
          status: 'completed',
          timestamp: Date.now() - 3600000,
          txHash: '0x123...abc',
          bridgeProvider: 'Wormhole'
        },
        {
          id: '2',
          fromChain: 'Asset Hub',
          toChain: 'Acala',
          amount: '50 DOT',
          status: 'pending',
          timestamp: Date.now() - 1800000,
          txHash: '0x456...def',
          bridgeProvider: 'XCM'
        }
      ];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch transaction history',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load bridge transaction history'
      );
    }
  }

  async executeBridgeTransfer(
    fromChain: string,
    toChain: string,
    amount: string,
    destinationAddress: string,
    signer: AddressOrPair,
    providerId: string
  ): Promise<string> {
    try {
      const provider = this.bridgeProviders.find(p => p.id === providerId);
      if (!provider) {
        throw new PolkadotHubError(
          'Invalid bridge provider',
          ErrorCodes.BRIDGE.UNAVAILABLE,
          'The selected bridge provider is not available'
        );
      }

      // Validate that the provider supports both chains
      if (!provider.supportedChains.includes(fromChain) || !provider.supportedChains.includes(toChain)) {
        throw new PolkadotHubError(
          'Unsupported chain',
          ErrorCodes.BRIDGE.ERROR,
          'One or both of the selected chains are not supported by this provider'
        );
      }

      if (provider.id === 'xcm') {
        const transferTx = await this.getXcmTransferTx({
          destChain: toChain,
          destAddress: destinationAddress,
          amount
        });

        const hash = await transferTx.signAndSend(signer);
        return hash.toString();
      }

      // For third-party bridges, integrate with their SDKs here
      throw new PolkadotHubError(
        'Provider not implemented',
        ErrorCodes.BRIDGE.ERROR,
        `${provider.name} integration is not yet implemented`
      );
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to execute bridge transfer',
        ErrorCodes.BRIDGE.ERROR,
        error instanceof Error ? error.message : 'Error executing bridge transfer'
      );
    }
  }

  async executeOnRamp(
    address: string,
    provider: string,
    fiatCurrency: string,
    cryptoCurrency: string,
    amount: string
  ): Promise<string> {
    try {
      // Validate parameters
      if (!address || !provider || !fiatCurrency || !cryptoCurrency || !amount) {
        throw new PolkadotHubError(
          'Invalid parameters',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Please provide all required parameters'
        );
      }

      const selectedProvider = this.onRampProviders.find(p => p.id === provider);
      if (!selectedProvider) {
        throw new PolkadotHubError(
          'Invalid provider',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Selected provider is not available'
        );
      }

      if (!selectedProvider.supportedFiatCurrencies.includes(fiatCurrency)) {
        throw new PolkadotHubError(
          'Unsupported fiat currency',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'The selected fiat currency is not supported'
        );
      }

      if (!selectedProvider.supportedCryptos.includes(cryptoCurrency)) {
        throw new PolkadotHubError(
          'Unsupported cryptocurrency',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'The selected cryptocurrency is not supported'
        );
      }

      // TODO: Implement actual on-ramp integration
      return `On-ramp transaction initiated: ${amount} ${fiatCurrency} to ${cryptoCurrency} via ${selectedProvider.name}`;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to execute on-ramp transaction',
        ErrorCodes.BRIDGE.ERROR,
        'Error processing on-ramp transaction'
      );
    }
  }
}

export const bridgeService = BridgeService.getInstance(); 