import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpenGovEducation } from '../OpenGovEducation';

describe('OpenGovEducation', () => {
  it('renders all difficulty levels', () => {
    render(<OpenGovEducation />);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows all topics by default', () => {
    render(<OpenGovEducation />);
    
    expect(screen.getByText('Introduction to OpenGov')).toBeInTheDocument();
    expect(screen.getByText('Governance Tracks')).toBeInTheDocument();
    expect(screen.getByText('Voting Mechanisms')).toBeInTheDocument();
    expect(screen.getByText('Vote Delegation')).toBeInTheDocument();
    expect(screen.getByText('Proposal Lifecycle')).toBeInTheDocument();
  });

  it('filters topics by difficulty level', () => {
    render(<OpenGovEducation />);
    
    // Click beginner filter
    fireEvent.click(screen.getByText('Beginner'));

    // Should show beginner topics
    expect(screen.getByText('Introduction to OpenGov')).toBeInTheDocument();
    expect(screen.getByText('Voting Mechanisms')).toBeInTheDocument();
    
    // Should not show intermediate/advanced topics
    expect(screen.queryByText('Governance Tracks')).not.toBeInTheDocument();
    expect(screen.queryByText('Proposal Lifecycle')).not.toBeInTheDocument();
  });

  it('shows help section with quick tips', () => {
    render(<OpenGovEducation />);
    
    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText('Join Discord')).toBeInTheDocument();
    expect(screen.getByText('Visit Wiki')).toBeInTheDocument();
    expect(screen.getByText('Quick Tips')).toBeInTheDocument();
  });

  it('displays quick tips in popover', () => {
    render(<OpenGovEducation />);
    
    // Click quick tips button
    fireEvent.click(screen.getByText('Quick Tips'));

    // Check popover content
    expect(screen.getByText('Start with beginner topics')).toBeInTheDocument();
    expect(screen.getByText('Practice with small amounts first')).toBeInTheDocument();
    expect(screen.getByText('Join community discussions')).toBeInTheDocument();
    expect(screen.getByText('Follow proposal discussions')).toBeInTheDocument();
    expect(screen.getByText('Ask questions in Discord')).toBeInTheDocument();
  });

  it('allows switching between difficulty levels', () => {
    render(<OpenGovEducation />);
    
    // Click intermediate filter
    fireEvent.click(screen.getByText('Intermediate'));

    // Should show intermediate topics
    expect(screen.getByText('Governance Tracks')).toBeInTheDocument();
    expect(screen.getByText('Vote Delegation')).toBeInTheDocument();

    // Click advanced filter
    fireEvent.click(screen.getByText('Advanced'));

    // Should show advanced topics
    expect(screen.getByText('Proposal Lifecycle')).toBeInTheDocument();

    // Click all filter
    fireEvent.click(screen.getByText('All'));

    // Should show all topics again
    expect(screen.getByText('Introduction to OpenGov')).toBeInTheDocument();
    expect(screen.getByText('Governance Tracks')).toBeInTheDocument();
    expect(screen.getByText('Proposal Lifecycle')).toBeInTheDocument();
  });
}); 