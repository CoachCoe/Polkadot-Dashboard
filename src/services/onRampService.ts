'use client';

import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

export interface OnRampProvider {
  id: string;
  name: string;
  description: string;
  type: 'fiat' | 'exchange';
  supportedFiatCurrencies: string[];
  supportedCryptos: string[];
  supportedCountries: string[];
  minimumAmount: string;
  maximumAmount: string;
  fees: {
    percentage: number;
    fixed: number;
    network: number;
  };
  kycRequired: boolean;
  estimatedTime: string;
  paymentMethods: string[];
  website: string;
  apiKey?: string;
}

export interface OnRampQuote {
  provider: string;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoCurrency: string;
  cryptoAmount: string;
  rate: string;
  fees: {
    percentage: number;
    fixed: number;
    network: number;
    total: string;
  };
  total: string;
  estimatedTime: string;
  paymentMethods: string[];
}

class OnRampService {
  private static instance: OnRampService;
  private providers: OnRampProvider[] = [
    {
      id: 'transak',
      name: 'Transak',
      description: 'Global fiat on-ramp solution with support for 100+ countries',
      type: 'fiat',
      supportedFiatCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
      supportedCryptos: ['DOT', 'KSM', 'ASTR', 'GLMR'],
      supportedCountries: ['US', 'UK', 'EU', 'AU', 'CA'],
      minimumAmount: '50',
      maximumAmount: '10000',
      fees: {
        percentage: 1.5,
        fixed: 2,
        network: 1
      },
      kycRequired: true,
      estimatedTime: '5-10 minutes',
      paymentMethods: ['credit-card', 'debit-card', 'bank-transfer', 'apple-pay', 'google-pay'],
      website: 'https://transak.com'
    },
    {
      id: 'ramp',
      name: 'Ramp Network',
      description: 'Fast and secure fiat on-ramp with competitive rates',
      type: 'fiat',
      supportedFiatCurrencies: ['USD', 'EUR', 'GBP'],
      supportedCryptos: ['DOT', 'KSM'],
      supportedCountries: ['US', 'UK', 'EU'],
      minimumAmount: '30',
      maximumAmount: '20000',
      fees: {
        percentage: 0.99,
        fixed: 1,
        network: 1
      },
      kycRequired: true,
      estimatedTime: '2-5 minutes',
      paymentMethods: ['credit-card', 'debit-card', 'bank-transfer', 'apple-pay'],
      website: 'https://ramp.network'
    },
    {
      id: 'kraken',
      name: 'Kraken',
      description: 'Leading cryptocurrency exchange with deep liquidity',
      type: 'exchange',
      supportedFiatCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD'],
      supportedCryptos: ['DOT', 'KSM', 'ASTR', 'GLMR', 'ACA'],
      supportedCountries: ['US', 'UK', 'EU', 'CA', 'JP', 'AU'],
      minimumAmount: '10',
      maximumAmount: '100000',
      fees: {
        percentage: 0.26,
        fixed: 0,
        network: 0.5
      },
      kycRequired: true,
      estimatedTime: '1-3 minutes',
      paymentMethods: ['bank-transfer', 'credit-card', 'debit-card'],
      website: 'https://kraken.com'
    },
    {
      id: 'binance',
      name: 'Binance',
      description: 'Global exchange platform with high trading volume',
      type: 'exchange',
      supportedFiatCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'BRL'],
      supportedCryptos: ['DOT', 'KSM', 'ASTR', 'GLMR', 'ACA'],
      supportedCountries: ['UK', 'EU', 'AU', 'BR'],
      minimumAmount: '20',
      maximumAmount: '50000',
      fees: {
        percentage: 0.1,
        fixed: 0,
        network: 0.5
      },
      kycRequired: true,
      estimatedTime: '1-5 minutes',
      paymentMethods: ['bank-transfer', 'credit-card', 'debit-card', 'p2p'],
      website: 'https://binance.com'
    }
  ];

  private constructor() {}

  static getInstance(): OnRampService {
    if (!OnRampService.instance) {
      OnRampService.instance = new OnRampService();
    }
    return OnRampService.instance;
  }

  getProviders(type?: 'fiat' | 'exchange'): OnRampProvider[] {
    if (type) {
      return this.providers.filter(provider => provider.type === type);
    }
    return this.providers;
  }

  async getQuote(
    providerId: string,
    fiatCurrency: string,
    cryptoCurrency: string,
    fiatAmount: string
  ): Promise<OnRampQuote> {
    try {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) {
        throw new PolkadotHubError(
          'Provider not found',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Selected provider is not available'
        );
      }

      if (!provider.supportedFiatCurrencies.includes(fiatCurrency)) {
        throw new PolkadotHubError(
          'Unsupported fiat currency',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'The selected fiat currency is not supported by this provider'
        );
      }

      if (!provider.supportedCryptos.includes(cryptoCurrency)) {
        throw new PolkadotHubError(
          'Unsupported cryptocurrency',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'The selected cryptocurrency is not supported by this provider'
        );
      }

      const amount = parseFloat(fiatAmount);
      if (isNaN(amount)) {
        throw new PolkadotHubError(
          'Invalid amount',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Please provide a valid amount'
        );
      }

      if (amount < parseFloat(provider.minimumAmount) || amount > parseFloat(provider.maximumAmount)) {
        throw new PolkadotHubError(
          'Invalid amount',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          `Amount must be between ${provider.minimumAmount} and ${provider.maximumAmount}`
        );
      }

      // TODO: Integrate with actual provider APIs
      // For now, return mock data based on provider fees
      const fees = {
        percentage: amount * (provider.fees.percentage / 100),
        fixed: provider.fees.fixed,
        network: provider.fees.network,
        total: (amount * (provider.fees.percentage / 100) + provider.fees.fixed + provider.fees.network).toFixed(2)
      };

      // Mock exchange rate (in reality, this would come from the provider's API)
      const rate = cryptoCurrency === 'DOT' ? '30' : '150';
      const cryptoAmount = ((amount - parseFloat(fees.total)) / parseFloat(rate)).toFixed(4);

      return {
        provider: provider.name,
        fiatCurrency,
        fiatAmount,
        cryptoCurrency,
        cryptoAmount,
        rate,
        fees,
        total: amount.toFixed(2),
        estimatedTime: provider.estimatedTime,
        paymentMethods: provider.paymentMethods
      };
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        throw error;
      }
      throw new PolkadotHubError(
        'Failed to get quote',
        ErrorCodes.ONRAMP.QUOTE_ERROR,
        'Error fetching quote from provider'
      );
    }
  }

  async executeOnRamp(
    providerId: string,
    fiatCurrency: string,
    cryptoCurrency: string,
    amount: string,
    paymentMethod: string,
    walletAddress: string
  ): Promise<string> {
    try {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) {
        throw new PolkadotHubError(
          'Provider not found',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Selected provider is not available'
        );
      }

      // Prevent unused variable warnings
      void [fiatCurrency, cryptoCurrency, amount, paymentMethod, walletAddress];

      // TODO: Integrate with provider SDKs
      // These parameters will be used when implementing the actual provider integration
      return `${provider.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to execute on-ramp',
        ErrorCodes.ONRAMP.TRANSACTION_ERROR,
        'Error processing on-ramp transaction'
      );
    }
  }

  compareQuotes(quotes: OnRampQuote[]): OnRampQuote[] {
    return quotes.sort((a, b) => {
      // Sort by total cost (including fees)
      const totalA = parseFloat(a.fees.total);
      const totalB = parseFloat(b.fees.total);
      if (totalA !== totalB) return totalA - totalB;

      // If total cost is the same, sort by estimated time
      const timeA = parseInt(a.estimatedTime.split('-')[0] || '0');
      const timeB = parseInt(b.estimatedTime.split('-')[0] || '0');
      return timeA - timeB;
    });
  }
}

export const onRampService = OnRampService.getInstance(); 