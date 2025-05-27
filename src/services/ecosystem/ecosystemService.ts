'use client';

import { Project, ProjectFilter, ProjectSortOptions, ProjectCategory } from '@/types/ecosystem';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

class EcosystemService {
  private static instance: EcosystemService;
  private projects: Project[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EcosystemService {
    if (!EcosystemService.instance) {
      EcosystemService.instance = new EcosystemService();
    }
    return EcosystemService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const response = await fetch('/api/ecosystem/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      this.projects = data.projects;
      this.isInitialized = true;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to initialize ecosystem data',
        ErrorCodes.DATA.ECOSYSTEM_LOAD_ERROR,
        'Unable to load project data. Please try again later.'
      );
    }
  }

  async getProjects(filter?: ProjectFilter, sort?: ProjectSortOptions): Promise<Project[]> {
    try {
      await this.initialize();
      let filteredProjects = this.projects;

      if (filter) {
        filteredProjects = this.applyFilters(filteredProjects, filter);
      }

      if (sort) {
        filteredProjects = this.sortProjects(filteredProjects, sort);
      }

      return filteredProjects;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch projects',
        ErrorCodes.DATA.PROJECT_FETCH_ERROR,
        'Unable to load projects. Please try again later.'
      );
    }
  }

  async getProjectById(id: string): Promise<Project> {
    try {
      await this.initialize();
      const project = this.projects.find(p => p.id === id);
      
      if (!project) {
        throw new PolkadotHubError(
          'Project not found',
          ErrorCodes.DATA.NOT_FOUND,
          'The requested project could not be found.'
        );
      }

      return project;
    } catch (error) {
      if (error instanceof PolkadotHubError) throw error;
      
      throw new PolkadotHubError(
        'Failed to fetch project',
        ErrorCodes.DATA.PROJECT_FETCH_ERROR,
        'Unable to load project details. Please try again later.'
      );
    }
  }

  async getProjectsByCategory(category: ProjectCategory): Promise<Project[]> {
    try {
      const projects = await this.getProjects({
        categories: [category]
      });
      return projects;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch projects by category',
        ErrorCodes.DATA.CATEGORY_ERROR,
        'Unable to load projects for the selected category.'
      );
    }
  }

  async searchProjects(query: string): Promise<Project[]> {
    try {
      const projects = await this.getProjects({
        searchTerm: query
      });
      return projects;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to search projects',
        ErrorCodes.DATA.PROJECT_FILTER_ERROR,
        'Unable to search projects. Please try again later.'
      );
    }
  }

  private applyFilters(projects: Project[], filter: ProjectFilter): Project[] {
    return projects.filter(project => {
      if (filter.categories?.length && !filter.categories.includes(project.category)) {
        return false;
      }

      if (filter.status?.length && !filter.status.includes(project.status)) {
        return false;
      }

      if (filter.chains?.length && !project.chains.some(chain => filter.chains?.includes(chain))) {
        return false;
      }

      if (filter.tags?.length && !project.tags.some(tag => filter.tags?.includes(tag))) {
        return false;
      }

      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
        const matchesSearch = 
          project.name.toLowerCase().includes(searchTerm) ||
          project.description.toLowerCase().includes(searchTerm) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      if (filter.isVerified !== undefined && project.isVerified !== filter.isVerified) {
        return false;
      }

      if (filter.isParachain !== undefined && project.isParachain !== filter.isParachain) {
        return false;
      }

      return true;
    });
  }

  private sortProjects(projects: Project[], sort: ProjectSortOptions): Project[] {
    return [...projects].sort((a, b) => {
      const multiplier = sort.direction === 'asc' ? 1 : -1;

      switch (sort.field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        
        case 'tvl':
          return multiplier * ((a.stats?.tvl || 0) - (b.stats?.tvl || 0));
        
        case 'dailyActiveUsers':
          return multiplier * ((a.stats?.dailyActiveUsers || 0) - (b.stats?.dailyActiveUsers || 0));
        
        case 'launchDate':
          const dateA = a.launchDate ? new Date(a.launchDate).getTime() : 0;
          const dateB = b.launchDate ? new Date(b.launchDate).getTime() : 0;
          return multiplier * (dateA - dateB);
        
        case 'marketCap':
          return multiplier * ((a.stats?.marketCap || 0) - (b.stats?.marketCap || 0));
        
        default:
          return 0;
      }
    });
  }
}

export const ecosystemService = EcosystemService.getInstance(); 