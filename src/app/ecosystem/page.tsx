'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ProjectCard } from '@/components/ecosystem/ProjectCard';
import { Input } from '@/components/ui/Input';
import { useEcosystem } from '@/hooks/useEcosystem';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { CategoryList } from '@/components/ecosystem/CategoryList';
import type { Project, ProjectFilter, ProjectStatus } from '@/types/ecosystem';

const statusOptions = [
  { value: 'live' as ProjectStatus, label: 'Live' },
  { value: 'beta' as ProjectStatus, label: 'Beta' },
  { value: 'testnet' as ProjectStatus, label: 'Testnet' },
  { value: 'development' as ProjectStatus, label: 'Development' },
  { value: 'concept' as ProjectStatus, label: 'Concept' }
];

const chainOptions = [
  { value: 'polkadot', label: 'Polkadot' },
  { value: 'kusama', label: 'Kusama' },
  { value: 'asset-hub', label: 'Asset Hub' },
  { value: 'acala', label: 'Acala' },
  { value: 'astar', label: 'Astar' },
  { value: 'moonbeam', label: 'Moonbeam' }
];

export default function EcosystemPage() {
  const {
    projects,
    categories,
    isLoading,
    error,
    updateFilters,
    refresh
  } = useEcosystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [filter, setFilter] = useState<ProjectFilter>({});

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateFilters({ searchTerm: value });
  };

  const handleFilterChange = (newFilter: ProjectFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    updateFilters(newFilter);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? undefined : categoryId);
    updateFilters({
      ...filter,
      categories: categoryId === selectedCategory ? [] : [categoryId as any]
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner className="w-12 h-12 text-pink-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <ErrorDisplay 
            error={error}
            action={{
              label: 'Try Again',
              onClick: refresh
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Polkadot Ecosystem
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover and explore projects building on Polkadot
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                className="w-full"
              />
            </div>
            <div className="flex space-x-4">
              <MultiSelect<ProjectStatus>
                placeholder="Status"
                items={statusOptions}
                value={filter.status || []}
                onValueChange={(value) => handleFilterChange({ status: value })}
                className="w-40"
              />
              <MultiSelect<string>
                placeholder="Chain"
                items={chainOptions}
                value={filter.chains || []}
                onValueChange={(value) => handleFilterChange({ chains: value })}
                className="w-40"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 