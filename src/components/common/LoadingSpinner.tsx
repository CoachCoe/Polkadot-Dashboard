import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className={cn("animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600", className)}></div>
      <p className="text-gray-500 mt-4">Loading...</p>
    </div>
  );
} 