/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render } from '@testing-library/react';
import RoadmapPage from '../page';

// Mock the Card component
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

describe('RoadmapPage', () => {
  it('renders without crashing', () => {
    // If this renders without throwing, the test passes
    render(<RoadmapPage />);
  });
}); 