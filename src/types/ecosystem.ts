import { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

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
  searchTerm?: string;
  categories?: ProjectCategory[];
  status?: ProjectStatus[];
  chains?: string[];
  tvlRanges?: string[];
  sortBy?: string;
  isVerified?: boolean;
  isParachain?: boolean;
}

export interface ProjectSortOptions {
  field: 'name' | 'tvl' | 'dailyActiveUsers' | 'launchDate' | 'marketCap';
  direction: 'asc' | 'desc';
}

export type CategoryIcon = string | ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { title?: string; titleId?: string; } & RefAttributes<SVGSVGElement>>;

export interface CategoryInfo {
  id: string;
  name: string;
  icon: CategoryIcon;
  count: number;
  description: string;
} 