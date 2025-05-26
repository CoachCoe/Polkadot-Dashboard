'use client';
import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProjectFiltersProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function ProjectFilters({
  availableTags,
  selectedTags,
  onTagsChange,
  onSearchChange,
  onClearFilters
}: ProjectFiltersProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearchChange(value);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666]" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search projects..."
          className="input-field pl-10"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#172026]">Filter by Tags</h3>
          {(selectedTags.length > 0 || searchInput) && (
            <button
              onClick={() => {
                setSearchInput('');
                onClearFilters();
              }}
              className="text-sm link-hover font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`
                transition-all
                ${selectedTags.includes(tag)
                  ? 'tag bg-[#E6007A] text-white'
                  : 'tag hover:bg-[#E6007A] hover:text-white'
                }
              `}
            >
              {tag}
              {selectedTags.includes(tag) && (
                <XMarkIcon className="inline-block ml-1 h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 