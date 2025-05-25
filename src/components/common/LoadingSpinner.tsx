import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      <p className="text-gray-500 mt-4">Loading...</p>
    </div>
  );
} 