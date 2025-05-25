'use client';

import { useState, useEffect, useCallback } from 'react';
import { ecosystemService, type Project, type ProjectCategory } from '@/services/ecosystem';
import { PolkadotHubError } from '@/utils/errorHandling';

interface EcosystemFilters {
  category?: string | undefined;
  search?: string;
  tags?: string[];
}

export function useEcosystem() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<EcosystemFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PolkadotHubError | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const filteredProjects = await ecosystemService.getProjects(filters);
      setProjects(filteredProjects);
    } catch (err) {
      setError(
        err instanceof PolkadotHubError
          ? err
          : new PolkadotHubError(
              'Failed to filter projects',
              'PROJECT_FILTER_ERROR',
              err instanceof Error ? err.message : 'Unknown error occurred'
            )
      );
      console.error('Project filtering error:', err);
    }
  }, [filters]);

  const loadEcosystemData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [categoriesData, tagsData, projectsData] = await Promise.all([
        ecosystemService.getCategories(),
        ecosystemService.getAllTags(),
        ecosystemService.getProjects(filters)
      ]);

      setCategories(categoriesData);
      setAvailableTags(tagsData);
      setProjects(projectsData);
    } catch (err) {
      setError(
        err instanceof PolkadotHubError
          ? err
          : new PolkadotHubError(
              'Failed to load ecosystem data',
              'ECOSYSTEM_LOAD_ERROR',
              err instanceof Error ? err.message : 'Unknown error occurred'
            )
      );
      console.error('Ecosystem data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadEcosystemData();
  }, [loadEcosystemData]);

  // Only update projects when filters change and initial data is loaded
  useEffect(() => {
    if (categories.length > 0 && !isLoading) {
      void loadProjects();
    }
  }, [loadProjects, categories.length, isLoading]);

  const updateFilters = useCallback((newFilters: Partial<EcosystemFilters>) => {
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        ...newFilters
      };
      
      // Remove undefined values
      Object.keys(updatedFilters).forEach(key => {
        if (updatedFilters[key as keyof EcosystemFilters] === undefined) {
          delete updatedFilters[key as keyof EcosystemFilters];
        }
      });

      return updatedFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getProjectById = useCallback((id: string): Project | undefined => {
    try {
      return ecosystemService.getProjectById(id);
    } catch (err) {
      console.error('Error fetching project by ID:', err);
      setError(
        err instanceof PolkadotHubError
          ? err
          : new PolkadotHubError(
              'Failed to fetch project',
              'PROJECT_FETCH_ERROR',
              err instanceof Error ? err.message : 'Unknown error occurred'
            )
      );
      return undefined;
    }
  }, []);

  return {
    categories,
    projects,
    availableTags,
    filters,
    isLoading,
    error,
    updateFilters,
    clearFilters,
    getProjectById,
    refresh: loadEcosystemData
  };
} 