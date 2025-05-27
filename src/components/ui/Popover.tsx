'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/utils/cn';

interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  open?: boolean | undefined;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Popover({
  children,
  content,
  open,
  onOpenChange,
  className
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <PopoverPrimitive.Root 
      open={open !== undefined ? open : internalOpen} 
      onOpenChange={handleOpenChange}
    >
      <PopoverPrimitive.Trigger asChild>
        {children}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            'z-50 w-72 rounded-md border bg-white p-4 shadow-md outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          sideOffset={5}
        >
          {content}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
} 