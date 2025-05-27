'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Props {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: { native: string }) => {
    onSelect(emoji.native);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      content={
        <div className="p-2">
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme="light"
            set="native"
          />
        </div>
      }
    >
      <Button variant="ghost" size="sm">
        😀 Add Reaction
      </Button>
    </Popover>
  );
} 