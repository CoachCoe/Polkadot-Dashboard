'use client';

import React from 'react';
import {
  CurrencyDollarIcon,
  PhotoIcon,
  ServerStackIcon,
  UserGroupIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';
import { ProjectCategory } from '@/types/ecosystem';

interface CategoryListProps {
  categories: { id: ProjectCategory; name: string; description: string; icon: string }[];
  selectedCategory?: string | undefined;
  onSelectCategory: (categoryId: string) => void;
  isLoading?: boolean;
}

const iconMap = {
  CurrencyDollarIcon,
  PhotoIcon,
  ServerStackIcon,
  UserGroupIcon,
  FingerPrintIcon
};

export function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading = false
}: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 rounded-lg h-32"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {categories.map((category) => {
        const Icon = iconMap[category.icon as keyof typeof iconMap];
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border transition-colors ${
              selectedCategory === category.id
                ? 'bg-pink-50 border-pink-200'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
          >
            {Icon && (
              <Icon
                className={`h-8 w-8 mb-3 ${
                  selectedCategory === category.id
                    ? 'text-pink-500'
                    : 'text-gray-500'
                }`}
              />
            )}
            <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
            <p className="text-sm text-gray-500 text-center">
              {category.description}
            </p>
          </button>
        );
      })}
    </div>
  );
} 