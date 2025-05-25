import React from 'react';
import {
  CurrencyDollarIcon,
  PhotoIcon,
  ServerStackIcon,
  UserGroupIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';
import { ProjectCategory } from '@/services/ecosystem';

interface CategoryListProps {
  categories: ProjectCategory[];
  selectedCategory?: string | undefined;
  onSelectCategory: (categoryId: string) => void;
  isLoading: boolean;
}

const iconMap = {
  CurrencyDollarIcon: CurrencyDollarIcon,
  PhotoIcon: PhotoIcon,
  ServerStackIcon: ServerStackIcon,
  UserGroupIcon: UserGroupIcon,
  FingerPrintIcon: FingerPrintIcon
} as const;

export function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading
}: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-white rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((category) => {
        const Icon = iconMap[category.icon as keyof typeof iconMap];
        return (
          <div
            key={category.id}
            className={`
              bg-white p-4 rounded-lg shadow-sm transition-all cursor-pointer
              ${selectedCategory === category.id
                ? 'ring-2 ring-[#E6007A] bg-[#FFF5F9]'
                : 'hover:bg-[#FFF5F9]'
              }
            `}
            onClick={() => onSelectCategory(category.id)}
          >
            <div className="flex items-center space-x-3 mb-3">
              {Icon && (
                <div className="p-2 bg-[#FFF5F9] rounded-lg">
                  <Icon className="h-6 w-6 text-[#E6007A]" />
                </div>
              )}
              <h3 className={`
                text-lg font-semibold transition-colors
                ${selectedCategory === category.id ? 'text-[#E6007A]' : 'text-[#172026]'}
              `}>
                {category.name}
              </h3>
            </div>
            <p className="text-sm text-[#666666]">
              {category.description}
            </p>
          </div>
        );
      })}
    </div>
  );
} 