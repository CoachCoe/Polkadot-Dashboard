/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OpenGovEducation } from '../OpenGovEducation';

// Mock UI components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  )
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/Popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>
}));

describe('OpenGovEducation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter buttons', () => {
    render(<OpenGovEducation />);
    
    const filterButtons = screen.getAllByRole('button');
    // @ts-ignore
    expect(filterButtons).toHaveLength(7); // All, Beginner, Intermediate, Advanced, Discord, Wiki, Quick Tips
    
    const expectedTexts = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Join Discord', 'Visit Wiki', 'Quick Tips'];
    expectedTexts.forEach(text => {
      // @ts-ignore
      expect(screen.getByRole('button', { name: text })).toBeInTheDocument();
    });
  });

  it('shows all topics by default', () => {
    render(<OpenGovEducation />);
    
    const topics = [
      'Introduction to OpenGov',
      'Governance Tracks',
      'Voting Mechanisms',
      'Vote Delegation',
      'Proposal Lifecycle'
    ];
    
    topics.forEach(topic => {
      // @ts-ignore
      expect(screen.getByText(topic)).toBeInTheDocument();
    });
  });

  it('filters topics by difficulty level', () => {
    render(<OpenGovEducation />);
    
    // Click beginner filter
    const beginnerButton = screen.getByRole('button', { name: 'Beginner' });
    fireEvent.click(beginnerButton);

    // Should show beginner topics
    // @ts-ignore
    expect(screen.getByText('Introduction to OpenGov')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Voting Mechanisms')).toBeInTheDocument();

    // Should not show other topics
    // @ts-ignore
    expect(screen.queryByText('Governance Tracks')).not.toBeInTheDocument();
    // @ts-ignore
    expect(screen.queryByText('Vote Delegation')).not.toBeInTheDocument();
    // @ts-ignore
    expect(screen.queryByText('Proposal Lifecycle')).not.toBeInTheDocument();
  });

  it('shows help section with quick tips', () => {
    render(<OpenGovEducation />);
    
    // @ts-ignore
    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByRole('button', { name: 'Join Discord' })).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByRole('button', { name: 'Visit Wiki' })).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByRole('button', { name: 'Quick Tips' })).toBeInTheDocument();
  });

  it('displays quick tips in popover', () => {
    render(<OpenGovEducation />);
    
    // Click quick tips button
    const quickTipsButton = screen.getByRole('button', { name: 'Quick Tips' });
    fireEvent.click(quickTipsButton);

    // Check popover content
    const popoverContent = screen.getByTestId('popover-content');
    // @ts-ignore
    expect(popoverContent).toBeInTheDocument();
    
    const tips = [
      'Start with beginner topics',
      'Practice with small amounts first',
      'Join community discussions',
      'Follow proposal discussions',
      'Ask questions in Discord'
    ];
    
    tips.forEach(tip => {
      // @ts-ignore
      expect(screen.getByText(tip)).toBeInTheDocument();
    });
  });

  it('allows switching between difficulty levels', () => {
    render(<OpenGovEducation />);
    
    // Click intermediate filter
    const intermediateButton = screen.getByRole('button', { name: 'Intermediate' });
    fireEvent.click(intermediateButton);

    // Should show intermediate topics
    // @ts-ignore
    expect(screen.getByText('Governance Tracks')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Vote Delegation')).toBeInTheDocument();

    // Should not show other topics
    // @ts-ignore
    expect(screen.queryByText('Introduction to OpenGov')).not.toBeInTheDocument();
    // @ts-ignore
    expect(screen.queryByText('Proposal Lifecycle')).not.toBeInTheDocument();

    // Click advanced filter
    const advancedButton = screen.getByRole('button', { name: 'Advanced' });
    fireEvent.click(advancedButton);

    // Should show advanced topics
    // @ts-ignore
    expect(screen.getByText('Proposal Lifecycle')).toBeInTheDocument();

    // Should not show other topics
    // @ts-ignore
    expect(screen.queryByText('Introduction to OpenGov')).not.toBeInTheDocument();
    // @ts-ignore
    expect(screen.queryByText('Governance Tracks')).not.toBeInTheDocument();
  });
}); 