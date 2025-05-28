'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { CategoryList } from '@/components/ecosystem/CategoryList';
import { ProjectCard } from '@/components/ecosystem/ProjectCard';
import { Input } from '@/components/ui/Input';
import { useEcosystem } from '@/hooks/useEcosystem';
import { projectStatsService } from '@/services/projectStats';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { Project, ProjectFilter, ProjectStatus } from '@/types/ecosystem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ecosystemService } from '@/services/ecosystem/ecosystemService';
import { useToast } from '@/hooks/useToast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MultiSelect } from '@/components/ui/MultiSelect';

// DetailedStats is just an alias for Project since we're already extending Project with stats
type DetailedStats = Project;

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

const tvlRangeOptions = [
  { value: '0-1m', label: '$0 - $1M' },
  { value: '1m-10m', label: '$1M - $10M' },
  { value: '10m-100m', label: '$10M - $100M' },
  { value: '100m+', label: '$100M+' }
];

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

  const handleRefresh = useCallback(() => {
    refresh();
    fetchProjectStats();
  }, [refresh, fetchProjectStats]);

  const isLoading = isLoadingProjects || isLoadingStats;
  const error = projectsError || statsError;

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ecosystemService.getProjects({ ...filter, searchTerm });
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <MultiSelect
                value={filter.status || []}
                onValueChange={(status) => handleFilterChange({ ...filter, status })}
                items={statusOptions}
                placeholder="Select status"
                disabled={loading}
                className="bg-white border-gray-200 shadow-sm"
              />
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chain</label>
              <MultiSelect
                value={filter.chains || []}
                onValueChange={(chains) => handleFilterChange({ ...filter, chains })}
                items={chainOptions}
                placeholder="Select chain"
                disabled={loading}
                className="bg-white border-gray-200 shadow-sm"
              />
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">TVL Range</label>
              <MultiSelect
                value={filter.tvlRanges || []}
                onValueChange={(tvlRanges) => handleFilterChange({ ...filter, tvlRanges })}
                items={tvlRangeOptions}
                placeholder="Select range"
                disabled={loading}
                className="bg-white border-gray-200 shadow-sm"
              />
            </div>
          </div>

          <div className="w-64">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
        </div>

        <section>
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectStats.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 