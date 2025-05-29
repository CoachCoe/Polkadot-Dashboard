/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OpenGovGuide } from '../OpenGovGuide';

// Mock UI components
jest.mock('@/components/ui/Dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  )
}));

jest.mock('@/components/ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>
}));

jest.mock('lucide-react', () => ({
  Info: () => <div data-testid="info-icon">Info Icon</div>
}));

describe('OpenGovGuide', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when open', () => {
    render(<OpenGovGuide isOpen={true} onClose={mockOnClose} />);
    
    const texts = [
      'Understanding OpenGov',
      'What is OpenGov?',
      'Governance Tracks',
      'Voting Power',
      'Decision Making'
    ];
    
    texts.forEach(text => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(<OpenGovGuide isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Understanding OpenGov')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<OpenGovGuide isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders all learn more links with correct attributes', () => {
    render(<OpenGovGuide isOpen={true} onClose={mockOnClose} />);
    
    const learnMoreLinks = screen.getAllByText(/learn more/i);
    expect(learnMoreLinks).toHaveLength(4);
    
    learnMoreLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders info icon', () => {
    render(<OpenGovGuide isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
  });
}); 