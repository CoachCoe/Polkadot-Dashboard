import React from 'react';
import { render, act } from '@testing-library/react';
import { VotingHistory } from '../VotingHistory';

// Mock all external dependencies
jest.mock('@/services/encryptionService', () => ({
  encryptionService: {
    getInstance: () => ({
      encrypt: jest.fn().mockResolvedValue('encrypted'),
      decrypt: jest.fn().mockResolvedValue('decrypted')
    })
  }
}));

jest.mock('@/services/polkadot', () => ({
  initializeApi: jest.fn().mockResolvedValue({}),
  api: {
    query: {
      democracy: {
        votingOf: jest.fn().mockResolvedValue([])
      }
    }
  }
}));

jest.mock('@/services/governance', () => ({
  governanceService: {
    getDelegationHistory: jest.fn().mockResolvedValue([])
  }
}));

describe('VotingHistory', () => {
  it('renders without crashing', async () => {
    const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    await act(async () => {
      render(<VotingHistory address={mockAddress} />);
    });
  });
}); 