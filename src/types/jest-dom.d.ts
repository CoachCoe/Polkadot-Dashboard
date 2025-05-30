/// <reference types="@testing-library/jest-dom" /> 

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeGreaterThan(number: number): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveLength(length: number): R;
      toBeVisible(): R;
      toBeInTheViewport(): R;
      toHaveClass(className: string): R;
      toHaveStyle(css: Record<string, any>): R;
      toHaveValue(value: string | number | string[]): R;
      toHaveBeenCalledTimes(times: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toBe(expected: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeNull(): R;
      toBeUndefined(): R;
      toBeDefined(): R;
      toContain(item: any): R;
      toEqual(expected: any): R;
      toMatch(regexp: RegExp | string): R;
      toThrow(error?: string | RegExp | Error | typeof Error): R;
    }
  }
}

export {}; 