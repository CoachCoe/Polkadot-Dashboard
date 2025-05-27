import { render, screen, fireEvent } from '@testing-library/react';
import { OpenGovGuide } from './OpenGovGuide';

describe('OpenGovGuide', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when open', () => {
    render(<OpenGovGuide isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Understanding OpenGov')).toBeInTheDocument();
    expect(screen.getByText('What is OpenGov?')).toBeInTheDocument();
    expect(screen.getByText('Governance Tracks')).toBeInTheDocument();
    expect(screen.getByText('Voting Power')).toBeInTheDocument();
    expect(screen.getByText('Decision Making')).toBeInTheDocument();
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

  it('renders all learn more links', () => {
    render(<OpenGovGuide isOpen={true} onClose={mockOnClose} />);
    
    const learnMoreLinks = screen.getAllByText(/learn more/i);
    expect(learnMoreLinks).toHaveLength(4);
    
    learnMoreLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
}); 