export type ProjectCategory =
  | 'defi'
  | 'nft'
  | 'infrastructure'
  | 'developer-tools'
  | 'gaming'
  | 'social'
  | 'dao'
  | 'privacy'
  | 'identity'
  | 'other';

export type ProjectStatus =
  | 'live'
  | 'beta'
  | 'testnet'
  | 'development'
  | 'concept';

export interface ProjectStats {
  tvl?: number;
  dailyActiveUsers?: number;
  totalTransactions?: number;
  monthlyVolume?: number;
  tokenPrice?: number;
  marketCap?: number;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  github?: string;
  documentation?: string;
}

export interface ProjectTeam {
  name: string;
  role: string;
  avatar?: string;
  linkedin?: string;
  twitter?: string;
}

export interface ProjectToken {
  symbol: string;
  name: string;
  address?: string;
  decimals: number;
  totalSupply?: string;
  price?: number;
  marketCap?: number;
  holders?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: ProjectCategory;
  subcategories?: string[];
  status: ProjectStatus;
  logo: string;
  coverImage?: string;
  launchDate?: string;
  stats?: ProjectStats;
  socialLinks: SocialLinks;
  team?: ProjectTeam[];
  token?: ProjectToken;
  features?: string[];
  integrations?: string[];
  chains: string[];
  tags: string[];
  isVerified: boolean;
  isParachain?: boolean;
  parachainId?: number;
  githubStats?: {
    stars: number;
    forks: number;
    contributors: number;
    lastUpdate: string;
  };
}

export interface ProjectFilter {
  categories?: ProjectCategory[];
  status?: ProjectStatus[];
  chains?: string[];
  tags?: string[];
  searchTerm?: string;
  isVerified?: boolean;
  isParachain?: boolean;
}

export interface ProjectSortOptions {
  field: 'name' | 'tvl' | 'dailyActiveUsers' | 'launchDate' | 'marketCap';
  direction: 'asc' | 'desc';
} 