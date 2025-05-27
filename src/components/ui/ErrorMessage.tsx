'use client';

import * as React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  variant = 'error',
  action,
  className
}: ErrorMessageProps) {
  const Icon = variant === 'error' ? XCircle : AlertTriangle;
  const bgColor = variant === 'error' ? 'bg-destructive/10' : 'bg-warning/10';
  const textColor = variant === 'error' ? 'text-destructive' : 'text-warning';
  const borderColor = variant === 'error' ? 'border-destructive/20' : 'border-warning/20';

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        bgColor,
        borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5', textColor)} />
        <div className="flex-1">
          {title && (
            <h4 className={cn('font-medium mb-1', textColor)}>
              {title}
            </h4>
          )}
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          {action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="mt-2"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 