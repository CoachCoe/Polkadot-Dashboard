import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders social media links', () => {
    render(<Footer />);
    
    // Check for social media links
    expect(screen.getByRole('link', { name: /polkadot on x/i })).toHaveAttribute('href', 'https://twitter.com/Polkadot');
    expect(screen.getByRole('link', { name: /polkadot discord/i })).toHaveAttribute('href', 'https://discord.gg/polkadot');
    expect(screen.getByRole('link', { name: /polkadot linkedin/i })).toHaveAttribute('href', 'https://www.linkedin.com/company/polkadot-network');
  });

  it('renders copyright text', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Polkadot Hub`))).toBeInTheDocument();
  });
}); 