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
              onClick: handleRefresh
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl" />
          <div className="relative space-y-6 p-8 backdrop-blur-xl bg-white/50 rounded-3xl border border-gray-100 shadow-xl">
            <h1 className="text-4xl font-bold bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Ecosystem Projects
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MultiSelect
                value={filter.status || []}
                onValueChange={(value: ProjectStatus[]) => handleFilterChange({ status: value })}
                items={statusOptions}
                placeholder="Status"
                className="bg-white/80 w-full"
              />
              <MultiSelect
                value={filter.chains || []}
                onValueChange={(value: string[]) => handleFilterChange({ chains: value })}
                items={chainOptions}
                placeholder="Chains"
                className="bg-white/80 w-full"
              />
              <MultiSelect
                value={filter.tvlRanges || []}
                onValueChange={(value: string[]) => handleFilterChange({ tvlRanges: value })}
                items={tvlRangeOptions}
                placeholder="TVL Range"
                className="bg-white/80 w-full"
              />
              <div className="relative sm:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50 p-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectStats.map((project) => (
            <div key={project.id} className="group">
              <div className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-pink-100">
                <ProjectCard project={project} />
              </div>
            </div>
          ))}
        </div>

        {projectStats.length === 0 && !loading && (
          <div className="text-center py-12 px-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No projects found matching your criteria</p>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 