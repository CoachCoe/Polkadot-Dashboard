'use client';

import React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectProps<T> {
  value: T[];
  onValueChange: (value: T[]) => void;
  items: { value: T; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect<T>({
  value,
  onValueChange,
  items,
  placeholder = 'Select items...',
  disabled = false,
  className
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false);

  return (
    <CommandPrimitive
      className={cn(
        'relative w-full overflow-visible bg-white text-sm rounded-lg border shadow-sm',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        className="flex flex-wrap gap-1 p-2 border-b"
        onClick={() => !disabled && setOpen(!open)}
      >
        {value.length === 0 && (
          <span className="text-gray-500">{placeholder}</span>
        )}
        {value.map((item) => {
          const label = items.find((i) => i.value === item)?.label;
          return (
            <span
              key={String(item)}
              className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm"
            >
              {label}
            </span>
          );
        })}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {items.map((item) => (
            <CommandPrimitive.Item
              key={String(item.value)}
              onSelect={() => {
                const newValue = value.includes(item.value)
                  ? value.filter((v) => v !== item.value)
                  : [...value, item.value];
                onValueChange(newValue);
              }}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100',
                value.includes(item.value) && 'bg-gray-50'
              )}
            >
              <div className="flex items-center justify-center w-4 h-4">
                {value.includes(item.value) && (
                  <Check className="w-3 h-3 text-pink-500" />
                )}
              </div>
              {item.label}
            </CommandPrimitive.Item>
          ))}
        </div>
      )}
    </CommandPrimitive>
  );
} 