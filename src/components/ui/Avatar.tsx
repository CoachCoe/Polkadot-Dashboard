'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/utils/cn';
import { encodeAddress } from '@polkadot/util-crypto';

interface AvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ address, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const shortAddress = React.useMemo(() => {
    try {
      const encoded = encodeAddress(address);
      return `${encoded.slice(0, 4)}...${encoded.slice(-4)}`;
    } catch {
      return address.slice(0, 8);
    }
  }, [address]);

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
    >
      <AvatarPrimitive.Image
        src={`https://robohash.org/${address}.png`}
        alt={shortAddress}
        className="aspect-square h-full w-full"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium"
      >
        {shortAddress}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
} 