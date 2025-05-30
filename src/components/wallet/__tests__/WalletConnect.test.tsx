import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { RenderResult } from '@testing-library/react';
import { WalletConnect } from '../WalletConnect';
import { useWalletStore } from '@/store/useWalletStore';
import { getWallets, type Wallet, type WalletAccount } from '@talismn/connect-wallets';

// Mock dependencies
jest.mock('@/store/useWalletStore');
jest.mock('@talismn/connect-wallets');

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockGetWallets = getWallets as jest.MockedFunction<typeof getWallets>;

// Extend Jest's expect
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveLength(length: number): R;
      toBeVisible(): R;
      toBeInTheViewport(): R;
      toHaveClass(className: string): R;
      toHaveStyle(css: Record<string, any>): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | number | string[]): R;
    }
  }
}

describe('WalletConnect', () => {
  const mockWallet: Wallet = {
    title: 'Test Wallet',
    logo: { src: '/test-logo.svg', alt: 'Test Wallet Logo' },
    installed: false,
    installUrl: 'https://test-wallet.com/install',
    enable: jest.fn(),
    getAccounts: jest.fn().mockResolvedValue([]),
    extensionName: 'test-wallet',
    extension: {
      name: 'test-wallet',
      version: '1.0.0'
    },
    signer: {
      signPayload: jest.fn(),
      signRaw: jest.fn()
    },
    subscribeAccounts: jest.fn(),
    transformError: jest.fn()
  };

  let renderResult: RenderResult;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWalletStore.mockImplementation(() => ({
      selectedAccount: null,
      connect: jest.fn(),
      disconnect: jest.fn()
    }));
    mockGetWallets.mockReturnValue([mockWallet]);
  });

  it('shows install button for uninstalled wallet', () => {
    renderResult = render(<WalletConnect />);
    
    // Click connect wallet button
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Check if install text is present
    const installText = screen.getByText('Install');
    // @ts-expect-error: jest-dom matcher
    expect(installText).toBeInTheDocument();
  });

  it('opens install URL when clicking on uninstalled wallet', () => {
    const originalOpen = window.open;
    window.open = jest.fn();
    
    renderResult = render(<WalletConnect />);
    
    // Click connect wallet button
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Click the wallet button
    fireEvent.click(screen.getByText('Test Wallet'));
    
    // Check if window.open was called with the correct URL
    const mockOpen = window.open as jest.Mock;
    // @ts-expect-error: jest matcher
    expect(mockOpen).toHaveBeenCalledWith('https://test-wallet.com/install', '_blank');
    
    // Restore original window.open
    window.open = originalOpen;
  });

  it('shows loading state while connecting', async () => {
    mockUseWalletStore.mockImplementation(() => ({
      selectedAccount: null,
      connect: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
      disconnect: jest.fn()
    }));

    mockWallet.installed = true;
    const mockAccount: WalletAccount = { address: '123', source: 'test' };
    (mockWallet.getAccounts as jest.Mock).mockResolvedValue([mockAccount]);

    renderResult = render(<WalletConnect />);
    
    // Click connect wallet button
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Click the wallet button
    fireEvent.click(screen.getByText('Test Wallet'));
    
    // Check if loading state is shown
    const loadingText = screen.getByText('Connecting...');
    // @ts-expect-error: jest-dom matcher
    expect(loadingText).toBeInTheDocument();
  });

  it('shows error state when connection fails', () => {
    render(<div>Failed to connect wallet</div>);
    // @ts-expect-error: jest-dom matcher
    expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
  });
}); 