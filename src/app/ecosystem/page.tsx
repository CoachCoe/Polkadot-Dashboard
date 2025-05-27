'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { CategoryList } from '@/components/ecosystem/CategoryList';
import { ProjectCard } from '@/components/ecosystem/ProjectCard';
import { ProjectFilters } from '@/components/ecosystem/ProjectFilters';
import { ProjectSort } from '@/components/ecosystem/ProjectSort';
import { Input } from '@/components/ui/Input';
import { useEcosystem } from '@/hooks/useEcosystem';
import { projectStatsService } from '@/services/projectStats';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { Project, ProjectFilter, ProjectSortOptions } from '@/types/ecosystem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ecosystemService } from '@/services/ecosystem/ecosystemService';
import { useToast } from '@/hooks/useToast';

// DetailedStats is just an alias for Project since we're already extending Project with stats
type DetailedStats = Project;

export default function EcosystemPage() {
  const { showToast } = useToast();
  const {
    categories,
    projects,
    isLoading: isLoadingProjects,
    error: projectsError,
    updateFilters,
    refresh
  } = useEcosystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>({});
  const [sort, setSort] = useState<ProjectSortOptions>({
    field: 'name',
    direction: 'asc'
  });
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [projectStats, setProjectStats] = useState<DetailedStats[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<PolkadotHubError | null>(null);
  const [loading, setLoading] = useState(false);

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
          if (!project.chains?.length) {
            console.warn(`Project ${project.id} has no associated chains`);
            return project;
          }
          const chain = project.chains[0];
          if (!chain) {
            console.warn(`Project ${project.id} has no valid chain`);
            return project;
          }
          const stats = await projectStatsService.getProjectStats(project.id, chain);
          return {
            ...project,
            stats: {
              ...project.stats,
              ...stats
            }
          };
        } catch (error) {
          console.error(`Failed to fetch stats for project ${project.id}:`, error);
          return project;
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilter(prev => ({ ...prev, searchTerm: value }));
  };

  const handleFilterChange = (newFilter: ProjectFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleSortChange = (newSort: ProjectSortOptions) => {
    setSort(prev => ({ ...prev, ...newSort }));
  };

  const handleRefresh = useCallback(() => {
    refresh();
    fetchProjectStats();
  }, [refresh, fetchProjectStats]);

  const isLoading = isLoadingProjects || isLoadingStats;
  const error = projectsError || statsError;

  useEffect(() => {
    loadProjects();
  }, [filter, sort]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ecosystemService.getProjects(
        { ...filter, searchTerm },
        sort
      );
      setProjectStats(data.map(project => ({
        ...project,
        stats: project.stats || {},
        status: project.status,
        socialLinks: project.socialLinks,
        chains: project.chains,
        isVerified: project.isVerified
      })) as DetailedStats[]);
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load projects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <aside className="space-y-6">
              <div>
                <Input
                  type="search"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <ProjectFilters
                currentFilter={filter}
                onChange={handleFilterChange}
              />
            </aside>

            <main className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  {projects.length} projects found
                </p>
                <ProjectSort
                  currentSort={sort}
                  onChange={handleSortChange}
                />
              </div>

              {loading ? (
                <div className="text-center py-8">Loading projects...</div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectStats.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No projects found matching your criteria
                </div>
              )}
            </main>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 