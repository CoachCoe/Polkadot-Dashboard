'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MultiSelectProps<T extends string> {
  value: T[];
  onValueChange: (value: T[]) => void;
  items: { value: T; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function MultiSelect<T extends string>({
  value,
  onValueChange,
  items,
  placeholder,
  disabled,
  className
}: MultiSelectProps<T>) {
  const [selectedValues, setSelectedValues] = React.useState<T[]>(value);

  React.useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  const handleValueChange = (itemValue: T) => {
    const newValues = selectedValues.includes(itemValue)
      ? selectedValues.filter((v) => v !== itemValue)
      : [...selectedValues, itemValue];
    setSelectedValues(newValues);
    onValueChange(newValues);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-1 border rounded-md bg-background">
        {selectedValues.map((selectedValue) => (
          <div
            key={selectedValue}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded"
          >
            <span className="text-sm">
              {items.find((item) => item.value === selectedValue)?.label}
            </span>
            <button
              type="button"
              onClick={() => handleValueChange(selectedValue)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="mt-1">
        <SelectPrimitive.Root>
          <SelectPrimitive.Trigger
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            disabled={disabled}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            >
              <SelectPrimitive.Viewport className="p-1">
                {items.map((item) => (
                  <SelectPrimitive.Item
                    key={item.value}
                    value={item.value}
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onClick={() => handleValueChange(item.value)}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    </div>
  );
}

export { MultiSelect }; 