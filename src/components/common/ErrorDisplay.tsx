import React from 'react';
import { XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { PolkadotHubError } from '@/utils/errorHandling';

interface ErrorDisplayProps {
  error?: PolkadotHubError | string;
  severity?: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  } | undefined;
}

export function ErrorDisplay({ error, severity = 'error', action }: ErrorDisplayProps) {
  const message = typeof error === 'string' ? error : error?.message;
  const details = typeof error === 'string' ? undefined : error?.details;
  const code = typeof error === 'string' ? undefined : error?.code;

  const getColors = () => {
    switch (severity) {
      case 'error':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: 'text-red-400',
          hover: 'hover:bg-red-100',
          ring: 'focus:ring-red-600',
          ringOffset: 'focus:ring-offset-red-50'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          icon: 'text-yellow-400',
          hover: 'hover:bg-yellow-100',
          ring: 'focus:ring-yellow-600',
          ringOffset: 'focus:ring-offset-yellow-50'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: 'text-blue-400',
          hover: 'hover:bg-blue-100',
          ring: 'focus:ring-blue-600',
          ringOffset: 'focus:ring-offset-blue-50'
        };
    }
  };

  const colors = getColors();
  const Icon = severity === 'error' ? XCircleIcon : 
               severity === 'warning' ? ExclamationTriangleIcon : 
               InformationCircleIcon;

  if (!message) return null;

  return (
    <div className={`rounded-md ${colors.bg} p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${colors.text}`}>{message}</h3>
          {details && (
            <div className="mt-2 text-sm">
              <p className={colors.text}>{details}</p>
            </div>
          )}
          {code && (
            <div className="mt-1">
              <p className={`text-xs ${colors.text} opacity-75`}>Error code: {code}</p>
            </div>
          )}
        </div>
        {action && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={action.onClick}
                className={`
                  inline-flex rounded-md px-2 py-1.5 text-sm font-medium
                  ${colors.bg} ${colors.text} ${colors.hover}
                  focus:outline-none focus:ring-2 ${colors.ring} ${colors.ringOffset}
                `}
              >
                {action.label}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 