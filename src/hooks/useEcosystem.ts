'use client';

import { useState, useEffect, useCallback } from 'react';
import { ecosystemService } from '@/services/ecosystem';
import { Project, CategoryInfo, ProjectFilter } from '@/types/ecosystem';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

export function useEcosystem() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProjectFilter>({});
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
              ErrorCodes.DATA.ECOSYSTEM_LOAD_ERROR,
              'Could not load project list'
            )
      );
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

  const updateFilters = useCallback((newFilters: Partial<ProjectFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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

  const getProjects = useCallback(async () => {
    try {
      const projectList = await ecosystemService.getProjects();
      setProjects(projectList);
      return projectList;
    } catch (err) {
      throw err instanceof PolkadotHubError
        ? err
        : new PolkadotHubError(
            'Failed to load projects',
            ErrorCodes.DATA.PROJECT_FETCH_ERROR,
            'Could not load project list'
          );
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
    getProjects,
    refresh: loadEcosystemData
  };
} 