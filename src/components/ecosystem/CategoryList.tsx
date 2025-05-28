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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`
            p-4 rounded-xl text-center transition-all duration-200
            border ${selectedCategory === category.id 
              ? 'border-pink-200 bg-pink-50/50' 
              : 'border-gray-200 hover:border-gray-300 bg-white/80'
            }
            hover:shadow-md
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {category.icon && (
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                ${selectedCategory === category.id 
                  ? 'bg-pink-100/50' 
                  : 'bg-gray-50'
                }`}
              >
                <category.icon 
                  className={`
                    w-8 h-8
                    ${selectedCategory === category.id 
                      ? 'text-pink-500' 
                      : 'text-gray-500'
                    }
                    transition-all duration-200
                  `}
                />
              </div>
            )}
            <span className={`text-sm font-medium
              ${selectedCategory === category.id 
                ? 'text-pink-700' 
                : 'text-gray-700'
              }`}
            >
              {category.name}
            </span>
            <span className={`
              text-xs mt-1
              ${selectedCategory === category.id ? 'text-pink-500' : 'text-gray-400'}
            `}>
              {category.count} projects
            </span>
          </div>
        </button>
      ))}
    </div>
  );
} 