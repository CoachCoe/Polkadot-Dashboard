'use client';

import React from 'react';
import { CategoryInfo } from '@/types/ecosystem';

interface CategoryListProps {
  categories: CategoryInfo[];
  selectedCategory?: string | undefined;
  onSelect: (categoryId: string) => void;
}

export function CategoryList({ categories, selectedCategory, onSelect }: CategoryListProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`
            flex flex-col items-center justify-center p-4 rounded-xl transition-all
            min-w-[140px] group relative
            ${
              selectedCategory === category.id
                ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-xl shadow-pink-500/20'
                : 'bg-white hover:bg-gray-50 text-gray-600 hover:shadow-lg hover:scale-105'
            }
            border border-gray-100
          `}
        >
          <div className={`
            w-12 h-12 flex items-center justify-center mb-3 rounded-lg
            ${selectedCategory === category.id ? 'bg-pink-400/20' : 'bg-gray-50 group-hover:bg-white'}
            transition-all duration-200
          `}>
            <img
              src={category.icon}
              alt={category.name}
              className={`
                w-8 h-8 object-contain
                ${selectedCategory === category.id ? 'brightness-200' : 'group-hover:scale-110'}
                transition-all duration-200
              `}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default-category.svg';
              }}
            />
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{category.name}</span>
          <span className={`
            text-xs mt-1
            ${selectedCategory === category.id ? 'text-pink-100' : 'text-gray-400'}
          `}>
            {category.count} projects
          </span>
          {selectedCategory === category.id && (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/10 rounded-xl pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
} 