export interface ProjectCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Heroicon name
}

export interface ProjectStats {
  tvl?: string;
  monthlyActiveUsers?: number;
  monthlyTransactions?: number;
  transactions24h?: number;
  uniqueUsers24h?: number;
  price?: string;
  marketCap?: string;
  volume24h?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  website: string;
  github?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  logo: string;
  chainId?: string; // Associated chain (if applicable)
  tags: string[];
  stats: ProjectStats;
}

interface EcosystemFilters {
  category?: string | undefined;
  search?: string;
  tags?: string[];
}

class EcosystemService {
  private static instance: EcosystemService;

  private categories: ProjectCategory[] = [
    {
      id: 'defi',
      name: 'DeFi',
      description: 'Decentralized Finance protocols and applications',
      icon: 'CurrencyDollarIcon'
    },
    {
      id: 'nft',
      name: 'NFTs & Gaming',
      description: 'NFT marketplaces, games, and collectibles',
      icon: 'PhotoIcon'
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      description: 'Core infrastructure and development tools',
      icon: 'ServerStackIcon'
    },
    {
      id: 'dao',
      name: 'DAOs & Governance',
      description: 'Decentralized organizations and governance tools',
      icon: 'UserGroupIcon'
    },
    {
      id: 'identity',
      name: 'Identity & Privacy',
      description: 'Identity management and privacy solutions',
      icon: 'FingerPrintIcon'
    }
  ];

  private projects: Project[] = [
    {
      id: 'acala',
      name: 'Acala',
      description: 'DeFi hub and decentralized stablecoin platform for the Polkadot ecosystem',
      category: 'defi',
      website: 'https://acala.network',
      github: 'https://github.com/AcalaNetwork',
      twitter: 'https://twitter.com/AcalaNetwork',
      discord: 'https://discord.gg/acala',
      telegram: 'https://t.me/acalaofficial',
      logo: '/projects/acala.svg',
      chainId: 'acala',
      tags: ['DeFi', 'Stablecoin', 'DEX', 'Liquid Staking'],
      stats: {
        tvl: '120000000',
        monthlyActiveUsers: 25000,
        monthlyTransactions: 150000
      }
    },
    {
      id: 'moonbeam',
      name: 'Moonbeam',
      description: 'Ethereum-compatible smart contract platform on Polkadot',
      category: 'infrastructure',
      website: 'https://moonbeam.network',
      github: 'https://github.com/PureStake/moonbeam',
      twitter: 'https://twitter.com/MoonbeamNetwork',
      discord: 'https://discord.gg/moonbeam',
      telegram: 'https://t.me/Moonbeam_Official',
      logo: '/projects/moonbeam.svg',
      chainId: 'moonbeam',
      tags: ['Smart Contracts', 'EVM', 'Infrastructure'],
      stats: {
        tvl: '250000000',
        monthlyActiveUsers: 50000,
        monthlyTransactions: 300000
      }
    },
    {
      id: 'astar',
      name: 'Astar',
      description: 'Multi-chain smart contract platform supporting WebAssembly and EVM',
      category: 'infrastructure',
      website: 'https://astar.network',
      github: 'https://github.com/AstarNetwork',
      twitter: 'https://twitter.com/AstarNetwork',
      discord: 'https://discord.gg/astarnetwork',
      telegram: 'https://t.me/astarnetwork',
      logo: '/projects/astar.svg',
      chainId: 'astar',
      tags: ['Smart Contracts', 'dApp Hub', 'Infrastructure'],
      stats: {
        tvl: '180000000',
        monthlyActiveUsers: 40000,
        monthlyTransactions: 250000
      }
    },
    {
      id: 'parallel',
      name: 'Parallel Finance',
      description: 'DeFi platform offering lending, staking, and AMM services',
      category: 'defi',
      website: 'https://parallel.fi',
      github: 'https://github.com/parallel-finance',
      twitter: 'https://twitter.com/ParallelFi',
      discord: 'https://discord.gg/parallel',
      logo: '/projects/parallel.svg',
      chainId: 'parallel',
      tags: ['DeFi', 'Lending', 'Staking', 'AMM'],
      stats: {
        tvl: '85000000',
        monthlyActiveUsers: 15000,
        monthlyTransactions: 100000
      }
    },
    {
      id: 'phala',
      name: 'Phala Network',
      description: 'Confidential computing protocol for Web3 privacy',
      category: 'infrastructure',
      website: 'https://phala.network',
      github: 'https://github.com/Phala-Network',
      twitter: 'https://twitter.com/PhalaNetwork',
      discord: 'https://discord.gg/phala',
      logo: '/projects/phala.svg',
      chainId: 'phala',
      tags: ['Privacy', 'Computation', 'Infrastructure'],
      stats: {
        tvl: '45000000',
        monthlyActiveUsers: 8000,
        monthlyTransactions: 50000
      }
    },
    {
      id: 'litentry',
      name: 'Litentry',
      description: 'Cross-chain identity aggregation protocol',
      category: 'identity',
      website: 'https://litentry.com',
      github: 'https://github.com/litentry',
      twitter: 'https://twitter.com/litentry',
      discord: 'https://discord.gg/litentry',
      logo: '/projects/litentry.svg',
      chainId: 'litentry',
      tags: ['Identity', 'DID', 'Privacy'],
      stats: {
        tvl: '25000000',
        monthlyActiveUsers: 5000,
        monthlyTransactions: 30000
      }
    },
    {
      id: 'rmrk',
      name: 'RMRK',
      description: 'Advanced NFT protocol with nested, multi-resource NFTs',
      category: 'nft',
      website: 'https://rmrk.app',
      github: 'https://github.com/rmrk-team',
      twitter: 'https://twitter.com/rmrkapp',
      discord: 'https://discord.gg/rmrk',
      logo: '/projects/rmrk.svg',
      chainId: 'kusama',
      tags: ['NFT', 'Gaming', 'Metaverse'],
      stats: {
        tvl: '15000000',
        monthlyActiveUsers: 12000,
        monthlyTransactions: 80000
      }
    },
    {
      id: 'subsocial',
      name: 'SubSocial',
      description: 'Decentralized social network platform',
      category: 'social',
      website: 'https://subsocial.network',
      github: 'https://github.com/subsocial-network',
      twitter: 'https://twitter.com/SubsocialChain',
      discord: 'https://discord.gg/subsocial',
      logo: '/projects/subsocial.svg',
      chainId: 'subsocial',
      tags: ['Social', 'Content', 'Web3'],
      stats: {
        tvl: '10000000',
        monthlyActiveUsers: 20000,
        monthlyTransactions: 150000
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

  getCategories(): ProjectCategory[] {
    return this.categories;
  }

  getAllTags(): string[] {
    const tags = new Set<string>();
    this.projects.forEach(project => {
      project.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  getProjects(filters?: EcosystemFilters): Project[] {
    let filteredProjects = [...this.projects];

    if (filters?.category) {
      filteredProjects = filteredProjects.filter(
        project => project.category === filters.category
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.tags?.length) {
      filteredProjects = filteredProjects.filter(project =>
        filters.tags!.every(tag => project.tags.includes(tag))
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