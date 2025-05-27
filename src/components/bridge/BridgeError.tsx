import React from 'react';
import { XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface BridgeErrorProps {
  error: PolkadotHubError;
  onRetry?: () => void;
  className?: string;
}

export function BridgeError({ error, onRetry, className = '' }: BridgeErrorProps) {
  const getErrorDetails = () => {
    switch (error.code) {
      case ErrorCodes.BRIDGE.UNAVAILABLE:
        return {
          title: 'Bridge Unavailable',
          message: 'The selected bridge is currently unavailable. This could be due to maintenance or network issues.',
          suggestion: 'Please try another bridge provider or wait a few minutes before trying again.'
        };
      case ErrorCodes.BRIDGE.ESTIMATE_ERROR:
        return {
          title: 'Fee Estimation Failed',
          message: 'Unable to estimate the bridge transfer fees.',
          suggestion: 'Please verify the amount and try again. If the issue persists, try a different bridge provider.'
        };
      case ErrorCodes.BRIDGE.TRANSFER_ERROR:
        return {
          title: 'Transfer Failed',
          message: 'The bridge transfer could not be completed.',
          suggestion: 'Please check your balance and ensure you have enough funds to cover the transfer amount and fees.'
        };
      case ErrorCodes.BRIDGE.ERROR:
        return {
          title: 'Bridge Error',
          message: error.message,
          suggestion: 'Please try again or contact support if the issue persists.'
        };
      case ErrorCodes.WALLET.NOT_CONNECTED:
        return {
          title: 'Wallet Not Connected',
          message: 'Please connect your wallet to use the bridge.',
          suggestion: 'Click the "Connect Wallet" button in the top right corner to proceed.'
        };
      default:
        return {
          title: 'Unexpected Error',
          message: error.message,
          suggestion: 'Please try again or contact support if the issue persists.'
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div className={`rounded-lg bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{details.title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{details.message}</p>
          </div>
          {details.suggestion && (
            <div className="mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{details.suggestion}</p>
                </div>
              </div>
            </div>
          )}
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                className="rounded bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                onClick={onRetry}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 