import { ERROR_MESSAGES } from '@/config/constants';

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delay: number
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delay * attempt);
      }
    }
  }
  
  throw lastError!;
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const validateInput = (input: unknown, type: 'string' | 'number' | 'address'): boolean => {
  if (!input) return false;
  
  switch (type) {
    case 'string':
      return typeof input === 'string' && input.length > 0;
    case 'number':
      return typeof input === 'number' && !isNaN(input);
    case 'address':
      return typeof input === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,}$/.test(input);
    default:
      return false;
  }
};

export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.NETWORK_ERROR;
}; 