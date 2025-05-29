import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeTruthy(): R;
      toBe(expected: any): R;
    }
  }
} 