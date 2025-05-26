import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { PolkadotHubError } from '@/utils/errorHandling';
import { Button } from '@/components/ui/Button';

interface ErrorDisplayProps {
  error: Error | PolkadotHubError;
  action?: {
    label: string;
    onClick: () => void;
  } | undefined;
}

export function ErrorDisplay({ error, action }: ErrorDisplayProps) {
  const isPolkadotError = error instanceof PolkadotHubError;
  const message = isPolkadotError ? error.userMessage : error.message;

  return (
    <div className="rounded-lg bg-red-50 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isPolkadotError ? error.code : 'Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            {isPolkadotError && error.details && (
              <p className="mt-1 text-sm text-red-600">{error.details}</p>
            )}
          </div>
          {action && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="text-red-800 hover:bg-red-100"
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 