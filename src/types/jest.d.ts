/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { GovernanceService } from '@/services/governance';
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveLength(length: number): R;
      toContain(item: any): R;
      toHaveBeenCalledTimes(n: number): R;
      toBe(expected: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeCalled(): R;
    }
  }
}

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toHaveAttribute(attr: string, value?: string): R;
  toHaveLength(length: number): R;
}

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T>, CustomMatchers {}
  }
}

// Extend the Jest Mock type
declare module 'jest' {
  interface Mock<T = any, Y extends any[] = any> {
    mockResolvedValue(value: T): Mock<T, Y>;
    mockResolvedValueOnce(value: T): Mock<T, Y>;
    mockRejectedValue(value: any): Mock<T, Y>;
    mockRejectedValueOnce(value: any): Mock<T, Y>;
  }
}

// Extend the GovernanceService type for mocking
declare module '@/services/governance' {
  interface GovernanceService {
    getFavorites: jest.Mock;
    addFavorite: jest.Mock;
    removeFavorite: jest.Mock;
    getReferenda: jest.Mock;
    getDelegationHistory: jest.Mock;
    getVotingHistory: jest.Mock;
  }
}

export {}; 