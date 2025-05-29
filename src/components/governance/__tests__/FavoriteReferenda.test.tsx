import React from 'react';
import { render, act } from '@testing-library/react';
import { FavoriteReferenda } from '../FavoriteReferenda';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' } },
    status: 'authenticated'
  })
}));

jest.mock('@/services/governance', () => ({
  governanceService: {
    getReferenda: jest.fn().mockResolvedValue([]),
    getFavoriteReferenda: jest.fn().mockResolvedValue([]),
    getFavorites: jest.fn().mockResolvedValue(new Set())
  }
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}));

describe('FavoriteReferenda', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      render(<FavoriteReferenda />);
    });
  });
}); 