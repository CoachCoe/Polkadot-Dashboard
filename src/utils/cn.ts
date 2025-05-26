import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind CSS classes with proper type checking and deduplication
 * @param inputs Array of class values to be merged
 * @returns Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]): string {
  if (!inputs.length) return '';
  
  try {
    return twMerge(clsx(inputs));
  } catch (error) {
    console.error('Error merging classes:', error);
    // Return a safe fallback of the first valid class string
    return inputs.find(input => typeof input === 'string') as string || '';
  }
} 