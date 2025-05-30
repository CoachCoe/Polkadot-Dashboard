// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/link since we're using it in many components
jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href, target: '_blank', rel: 'noopener noreferrer' }, children);
  };
  return Link;
});

// Mock next/navigation since we're using it in many components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Mock the encryption service globally
jest.mock('@/services/encryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn((data: string) => data),
    decrypt: jest.fn((data: string) => data),
    getInstance: jest.fn(() => ({
      encrypt: jest.fn((data: string) => data),
      decrypt: jest.fn((data: string) => data)
    }))
  }
})); 