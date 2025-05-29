import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomePage } from '../HomePage';

// Mock WebSocket
class MockWebSocket {
  constructor(url: string) {}
  send() {}
  close() {}
}

// Mock next/link since we're using it in HomePage
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Set up global WebSocket mock
global.WebSocket = MockWebSocket as any;

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    // @ts-ignore
    expect(screen.getByText('Explore Polkadot with a Modern Dashboard')).toBeInTheDocument();
  });

  it('renders the main action buttons with correct hrefs', () => {
    render(<HomePage />);
    const dashboardButton = screen.getByRole('link', { name: 'Launch Dashboard' });
    const githubButton = screen.getByRole('link', { name: 'View on GitHub' });
    
    // Check if hrefs are correct
    if (dashboardButton.getAttribute('href') !== '/dashboard') {
      throw new Error('Dashboard button has incorrect href');
    }
    if (githubButton.getAttribute('href') !== 'https://github.com/CoachCoe/Polkadot-Dashboard') {
      throw new Error('GitHub button has incorrect href');
    }
  });

  it('renders all feature cards', () => {
    render(<HomePage />);
    const features = ['Portfolio', 'Staking', 'Governance', 'Ecosystem', 'Developer', 'Network'];
    features.forEach(feature => {
      // @ts-ignore
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('renders all footer links', () => {
    render(<HomePage />);
    const footerLinks = ['GitHub', 'Polkadot Network', 'Polkadot.js', 'Wiki'];
    footerLinks.forEach(link => {
      screen.getByRole('link', { name: link });
    });
    // @ts-ignore
    expect(screen.getByText('Built with ❤️ for the Polkadot community')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<HomePage />);
    const links = [
      { name: 'Open Portfolio →', href: '/dashboard' },
      { name: 'Start Staking →', href: '/staking' },
      { name: 'Participate →', href: '/governance' },
      { name: 'Explore →', href: '/ecosystem' },
      { name: 'View Docs →', href: 'https://polkadot.js.org/docs/' },
      { name: 'View Stats →', href: '/dashboard' }
    ];
    
    links.forEach(({ name, href }) => {
      const link = screen.getByRole('link', { name });
      if (link.getAttribute('href') !== href) {
        throw new Error(`Link "${name}" has incorrect href`);
      }
    });
  });
}); 