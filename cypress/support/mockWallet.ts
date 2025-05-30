import type { Wallet, WalletAccount } from '@talismn/connect-wallets';

export const mockAccount: WalletAccount = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  name: 'Test Account',
  source: 'polkadot-js',
};

export const mockWallet: Wallet = {
  enable: () => Promise.resolve(true),
  getAccounts: () => Promise.resolve([mockAccount]),
  subscribeAccounts: (callback) => {
    callback([mockAccount]);
    return () => {};
  },
  installed: true,
  title: 'Polkadot.js',
  extensionName: 'polkadot-js',
  installUrl: 'https://polkadot.js.org/extension/',
  logo: {
    src: 'https://polkadot.js.org/logo.svg',
    alt: 'Polkadot.js',
  },
  signer: {} as any,
  extension: {} as any,
  transformError: (err: Error) => err,
}; 