'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { CategoryList } from '@/components/ecosystem/CategoryList';
import { ProjectCard } from '@/components/ecosystem/ProjectCard';
import { ProjectFilters } from '@/components/ecosystem/ProjectFilters';
import { useEcosystem } from '@/hooks/useEcosystem';
import { projectStatsService } from '@/services/projectStats';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { Project, ProjectStats } from '@/services/ecosystem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DetailedStats extends Project {
  stats: ProjectStats;
}

export default function EcosystemPage() {
  const {
    categories,
    projects,
    availableTags,
    isLoading: isLoadingProjects,
    error: projectsError,
    updateFilters,
    clearFilters,
    refresh
  } = useEcosystem();

  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projectStats, setProjectStats] = useState<DetailedStats[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<PolkadotHubError | null>(null);

  const fetchProjectStats = useCallback(async () => {
    if (!projects.length) {
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      setStatsError(null);

      const statsPromises = projects.map(async (project) => {
        try {
          const stats = await projectStatsService.getProjectStats(project.id);
          return {
            ...project,
            stats
          };
        } catch (error) {
          throw error instanceof PolkadotHubError
            ? error
            : new PolkadotHubError(
                `Failed to fetch stats for ${project.id}`,
                ErrorCodes.DATA.PROJECT_STATS_ERROR,
                error instanceof Error ? error.message : 'Unknown error occurred'
              );
        }
      });

      const stats = await Promise.all(statsPromises);
      setProjectStats(stats);
      setStatsError(null);
    } catch (err) {
      setStatsError(
        err instanceof PolkadotHubError
          ? err
          : new PolkadotHubError(
              'Failed to load ecosystem data',
              ErrorCodes.DATA.NOT_FOUND,
              'Could not load project statistics'
            )
      );
    } finally {
      setIsLoadingStats(false);
    }
  }, [projects]);

  useEffect(() => {
    fetchProjectStats();
  }, [fetchProjectStats]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? undefined : categoryId);
    updateFilters({
      category: categoryId === selectedCategory ? undefined : categoryId
    });
  }, [selectedCategory, updateFilters]);

  const handleTagsChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
    updateFilters({ tags });
  }, [updateFilters]);

  const handleSearchChange = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory(undefined);
    setSelectedTags([]);
    clearFilters();
  }, [clearFilters]);

  const handleRefresh = useCallback(() => {
    refresh();
    fetchProjectStats();
  }, [refresh, fetchProjectStats]);

  const isLoading = isLoadingProjects || isLoadingStats;
  const error = projectsError || statsError;

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorDisplay 
          error={error}
          action={{
            label: 'Try Again',
            onClick: handleRefresh
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ecosystem Projects</h1>
          <button
            onClick={handleRefresh}
            className="text-pink-600 hover:text-pink-700"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            isLoading={isLoadingProjects}
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className="text-sm text-gray-500">
              {projects.length} projects found
            </p>
          </div>

          <ProjectFilters
            availableTags={availableTags}
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projectStats.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No projects found matching your filters.</p>
              </div>
            ) : (
              projectStats.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 