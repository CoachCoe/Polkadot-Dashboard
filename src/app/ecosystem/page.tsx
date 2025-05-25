'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { CategoryList } from '@/components/ecosystem/CategoryList';
import { ProjectCard } from '@/components/ecosystem/ProjectCard';
import { ProjectFilters } from '@/components/ecosystem/ProjectFilters';
import { useEcosystem } from '@/hooks/useEcosystem';
import { projectStatsService } from '@/services/projectStats';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError } from '@/utils/errorHandling';
import type { ProjectStats } from '@/services/ecosystem';

interface ExtendedStats {
  [projectId: string]: ProjectStats;
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
  const [realTimeStats, setRealTimeStats] = useState<ExtendedStats>({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<PolkadotHubError | null>(null);

  const loadRealTimeStats = useCallback(async () => {
    if (!projects.length) return;

    try {
      setIsLoadingStats(true);
      setStatsError(null);

      const stats: ExtendedStats = {};
      await Promise.all(
        projects.map(async (project) => {
          try {
            const projectStats = await projectStatsService.getProjectStats(
              project.id,
              project.chainId
            );
            stats[project.id] = projectStats;
          } catch (error) {
            console.error(`Failed to fetch stats for ${project.id}:`, error);
            // Don't fail the entire operation for one project
            stats[project.id] = {};
            
            // Set error only if it's the first one
            if (!statsError) {
              setStatsError(
                error instanceof PolkadotHubError
                  ? error
                  : new PolkadotHubError(
                      `Failed to fetch stats for ${project.id}`,
                      'PROJECT_STATS_ERROR',
                      error instanceof Error ? error.message : 'Unknown error occurred'
                    )
              );
            }
          }
        })
      );

      setRealTimeStats(stats);
    } catch (err) {
      setStatsError(
        err instanceof PolkadotHubError
          ? err
          : new PolkadotHubError(
              'Failed to load real-time statistics',
              'STATS_LOAD_ERROR',
              err instanceof Error ? err.message : 'Unknown error occurred'
            )
      );
      console.error('Stats loading error:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [projects, statsError]);

  useEffect(() => {
    void loadRealTimeStats();
  }, [loadRealTimeStats]);

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
    void loadRealTimeStats();
  }, [refresh, loadRealTimeStats]);

  const isLoading = isLoadingProjects || isLoadingStats;
  const error = projectsError || statsError;

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

        {error && (
          <ErrorDisplay
            error={error}
            action={{
              label: 'Try Again',
              onClick: handleRefresh
            }}
          />
        )}

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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg"></div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No projects found matching your filters.</p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={{
                    ...project,
                    stats: {
                      ...project.stats,
                      ...realTimeStats[project.id]
                    }
                  }}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 