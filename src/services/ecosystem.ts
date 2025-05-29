import { Project, ProjectCategory, ProjectStatus, SocialLinks, ProjectStats, CategoryInfo, ProjectFilter } from '@/types/ecosystem';
import {
  CurrencyDollarIcon,
  PhotoIcon,
  ServerStackIcon,
  UserGroupIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';

export type { Project, ProjectCategory, ProjectStatus, SocialLinks, ProjectStats };

export class EcosystemService {
  private static instance: EcosystemService;

  private categories: CategoryInfo[] = [
    {
      id: 'defi',
      name: 'DeFi',
      description: 'Decentralized Finance protocols and applications',
      icon: CurrencyDollarIcon,
      count: 0
    },
    {
      id: 'nft',
      name: 'NFTs & Gaming',
      description: 'NFT marketplaces, games, and collectibles',
      icon: PhotoIcon,
      count: 0
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      description: 'Core infrastructure and development tools',
      icon: ServerStackIcon,
      count: 0
    },
    {
      id: 'dao',
      name: 'DAOs & Governance',
      description: 'Decentralized organizations and governance tools',
      icon: UserGroupIcon,
      count: 0
    },
    {
      id: 'identity',
      name: 'Identity & Privacy',
      description: 'Identity management and privacy solutions',
      icon: FingerPrintIcon,
      count: 0
    }
  ];

  private projects: Project[] = [
    {
      id: 'acala',
      name: 'Acala',
      description: 'DeFi hub and decentralized stablecoin platform for the Polkadot ecosystem',
      category: 'defi',
      status: 'live',
      logo: '/projects/acala.svg',
      chains: ['polkadot', 'acala'],
      tags: ['DeFi', 'Stablecoin', 'DEX', 'Liquid Staking'],
      isVerified: true,
      isParachain: true,
      parachainId: 2000,
      socialLinks: {
        website: 'https://acala.network',
        github: 'https://github.com/AcalaNetwork',
        twitter: 'https://twitter.com/AcalaNetwork',
        discord: 'https://discord.gg/acala',
        telegram: 'https://t.me/acalaofficial'
      },
      stats: {
        tvl: 120000000,
        dailyActiveUsers: 25000,
        totalTransactions: 150000,
        monthlyVolume: 75000000,
        tokenPrice: 0.25,
        marketCap: 25000000
      }
    },
    {
      id: 'moonbeam',
      name: 'Moonbeam',
      description: 'Ethereum-compatible smart contract platform on Polkadot',
      category: 'infrastructure',
      status: 'live',
      logo: '/projects/moonbeam.svg',
      chains: ['polkadot', 'moonbeam'],
      tags: ['Smart Contracts', 'EVM', 'Infrastructure'],
      isVerified: true,
      isParachain: true,
      parachainId: 1000,
      socialLinks: {
        website: 'https://moonbeam.network',
        github: 'https://github.com/PureStake/moonbeam',
        twitter: 'https://twitter.com/MoonbeamNetwork',
        discord: 'https://discord.gg/moonbeam',
        telegram: 'https://t.me/Moonbeam_Official'
      },
      stats: {
        tvl: 250000000,
        dailyActiveUsers: 50000,
        totalTransactions: 300000,
        monthlyVolume: 150000000,
        tokenPrice: 0.75,
        marketCap: 75000000
      }
    },
    {
      id: 'astar',
      name: 'Astar',
      description: 'Multi-chain smart contract platform supporting WebAssembly and EVM',
      category: 'infrastructure',
      status: 'live',
      logo: '/projects/astar.svg',
      chains: ['polkadot', 'astar'],
      tags: ['Smart Contracts', 'dApp Hub', 'Infrastructure'],
      isVerified: true,
      isParachain: true,
      parachainId: 2006,
      socialLinks: {
        website: 'https://astar.network',
        github: 'https://github.com/AstarNetwork',
        twitter: 'https://twitter.com/AstarNetwork',
        discord: 'https://discord.gg/astarnetwork',
        telegram: 'https://t.me/astarnetwork'
      },
      stats: {
        tvl: 180000000,
        dailyActiveUsers: 40000,
        totalTransactions: 250000,
        monthlyVolume: 120000000,
        tokenPrice: 0.35,
        marketCap: 45000000
      }
    }
  ];

  private constructor() {}

  static getInstance(): EcosystemService {
    if (!EcosystemService.instance) {
      EcosystemService.instance = new EcosystemService();
    }
    return EcosystemService.instance;
  }

  getCategories(): CategoryInfo[] {
    return this.categories;
  }

  getAllTags(): string[] {
    const tags = new Set<string>();
    this.projects.forEach(project => {
      project.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  getProjects(filters?: ProjectFilter): Project[] {
    let filteredProjects = [...this.projects];

    if (filters?.categories?.length) {
      filteredProjects = filteredProjects.filter(
        project => filters.categories!.includes(project.category)
      );
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredProjects = filteredProjects.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.status?.length) {
      filteredProjects = filteredProjects.filter(
        project => filters.status!.includes(project.status)
      );
    }

    if (filters?.chains?.length) {
      filteredProjects = filteredProjects.filter(project =>
        filters.chains!.some(chain => project.chains.includes(chain))
      );
    }

    if (filters?.isVerified !== undefined) {
      filteredProjects = filteredProjects.filter(
        project => project.isVerified === filters.isVerified
      );
    }

    if (filters?.isParachain !== undefined) {
      filteredProjects = filteredProjects.filter(
        project => project.isParachain === filters.isParachain
      );
    }

    return filteredProjects;
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  getAllProjects(): Project[] {
    return this.projects;
  }
}

export const ecosystemService = EcosystemService.getInstance(); 