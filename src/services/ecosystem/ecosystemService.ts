'use client';

import { Project, ProjectFilter, ProjectSortOptions, ProjectCategory, CategoryInfo } from '@/types/ecosystem';
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

  async getCategories(): Promise<CategoryInfo[]> {
    try {
      await this.initialize();
      
      const categoryMap = new Map<ProjectCategory, number>();
      this.projects.forEach(project => {
        const count = categoryMap.get(project.category) || 0;
        categoryMap.set(project.category, count + 1);
      });

      return [
        {
          id: 'defi',
          name: 'DeFi',
          description: 'Decentralized Finance applications and protocols',
          icon: '/images/categories/defi.svg',
          count: categoryMap.get('defi') || 0
        },
        {
          id: 'nft',
          name: 'NFTs',
          description: 'Non-Fungible Token platforms and marketplaces',
          icon: '/images/categories/nft.svg',
          count: categoryMap.get('nft') || 0
        },
        {
          id: 'infrastructure',
          name: 'Infrastructure',
          description: 'Core blockchain infrastructure and protocols',
          icon: '/images/categories/infrastructure.svg',
          count: categoryMap.get('infrastructure') || 0
        },
        {
          id: 'developer-tools',
          name: 'Developer Tools',
          description: 'Tools and services for blockchain developers',
          icon: '/images/categories/developer-tools.svg',
          count: categoryMap.get('developer-tools') || 0
        },
        {
          id: 'gaming',
          name: 'Gaming',
          description: 'Blockchain gaming and GameFi projects',
          icon: '/images/categories/gaming.svg',
          count: categoryMap.get('gaming') || 0
        },
        {
          id: 'social',
          name: 'Social',
          description: 'Social networks and communication platforms',
          icon: '/images/categories/social.svg',
          count: categoryMap.get('social') || 0
        },
        {
          id: 'dao',
          name: 'DAO',
          description: 'Decentralized Autonomous Organizations',
          icon: '/images/categories/dao.svg',
          count: categoryMap.get('dao') || 0
        },
        {
          id: 'privacy',
          name: 'Privacy',
          description: 'Privacy-focused solutions and protocols',
          icon: '/images/categories/privacy.svg',
          count: categoryMap.get('privacy') || 0
        },
        {
          id: 'identity',
          name: 'Identity',
          description: 'Identity and authentication solutions',
          icon: '/images/categories/identity.svg',
          count: categoryMap.get('identity') || 0
        },
        {
          id: 'other',
          name: 'Other',
          description: 'Other blockchain projects and services',
          icon: '/images/categories/other.svg',
          count: categoryMap.get('other') || 0
        }
      ];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch categories',
        ErrorCodes.DATA.CATEGORY_ERROR,
        'Unable to load categories. Please try again later.'
      );
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      await this.initialize();
      const tags = new Set<string>();
      this.projects.forEach(project => {
        project.tags.forEach(tag => tags.add(tag));
      });
      return Array.from(tags);
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch tags',
        ErrorCodes.DATA.PROJECT_FILTER_ERROR,
        'Unable to load tags. Please try again later.'
      );
    }
  }
}

export const ecosystemService = EcosystemService.getInstance(); 