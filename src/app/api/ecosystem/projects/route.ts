import { NextResponse } from 'next/server';
import type { Project } from '@/types/ecosystem';

// This is a mock database of projects
// In a real application, this would come from a database
const projects: Project[] = [
  {
    id: 'acala',
    name: 'Acala',
    description: 'DeFi hub and decentralized stablecoin platform for the Polkadot ecosystem.',
    longDescription: `Acala is a decentralized finance network powering the aUSD ecosystem. It's a DeFi and liquidity hub specialized for the Polkadot ecosystem, offering a suite of financial primitives including a multi-collateralized stablecoin (aUSD), a trustless staking derivative (LDOT), and a decentralized exchange.

The platform is built using Substrate framework and makes use of Polkadot's unique cross-chain capabilities to aggregate liquidity and power DeFi applications.`,
    category: 'defi',
    subcategories: ['stablecoin', 'dex', 'lending'],
    status: 'live',
    logo: 'https://raw.githubusercontent.com/polkadot-js/apps/master/packages/apps/public/logos/acala.svg',
    coverImage: 'https://acala.network/static/media/acala-banner.png',
    launchDate: '2021-12-18',
    stats: {
      tvl: 150000000,
      dailyActiveUsers: 5000,
      totalTransactions: 1500000,
      monthlyVolume: 75000000
    },
    socialLinks: {
      website: 'https://acala.network',
      twitter: 'https://twitter.com/AcalaNetwork',
      telegram: 'https://t.me/acalaofficial',
      discord: 'https://discord.gg/acala',
      github: 'https://github.com/AcalaNetwork',
      documentation: 'https://wiki.acala.network'
    },
    team: [
      {
        name: 'Ruitao Su',
        role: 'Co-founder & CEO',
        twitter: 'https://twitter.com/ruitao_su'
      },
      {
        name: 'Bryan Chen',
        role: 'Co-founder & CTO',
        twitter: 'https://twitter.com/xlc'
      }
    ],
    token: {
      symbol: 'ACA',
      name: 'Acala Token',
      decimals: 12,
      totalSupply: '1000000000',
      price: 0.15,
      marketCap: 150000000,
      holders: 50000
    },
    features: [
      'Multi-collateralized stablecoin (aUSD)',
      'Automated market maker DEX',
      'Liquid staking derivatives',
      'Cross-chain capabilities',
      'Earn yield on deposits',
      'Governance participation'
    ],
    integrations: [
      'Polkadot',
      'Kusama',
      'Asset Hub',
      'Moonbeam'
    ],
    chains: ['polkadot', 'kusama'],
    tags: ['defi', 'stablecoin', 'dex', 'lending', 'liquid-staking'],
    isVerified: true,
    isParachain: true,
    parachainId: 2000,
    githubStats: {
      stars: 1200,
      forks: 300,
      contributors: 45,
      lastUpdate: '2024-02-15'
    }
  },
  {
    id: 'astar',
    name: 'Astar Network',
    description: 'Multi-chain smart contract platform supporting WebAssembly and EVM.',
    longDescription: `Astar Network is a multi-chain dApp hub supporting WebAssembly and EVM on Polkadot. It enables developers to deploy their dApps using multiple virtual machines, fostering a vibrant cross-chain ecosystem.

The network features unique mechanisms like dApp staking, allowing token holders to stake their tokens on their favorite dApps and earn rewards while supporting the ecosystem's growth.`,
    category: 'infrastructure',
    subcategories: ['smart-contracts', 'defi'],
    status: 'live',
    logo: 'https://raw.githubusercontent.com/polkadot-js/apps/master/packages/apps/public/logos/astar.svg',
    coverImage: 'https://astar.network/images/hero-bg.jpg',
    launchDate: '2022-01-17',
    stats: {
      tvl: 200000000,
      dailyActiveUsers: 8000,
      totalTransactions: 2500000,
      monthlyVolume: 120000000
    },
    socialLinks: {
      website: 'https://astar.network',
      twitter: 'https://twitter.com/AstarNetwork',
      telegram: 'https://t.me/astarnetwork',
      discord: 'https://discord.gg/astarnetwork',
      github: 'https://github.com/AstarNetwork',
      documentation: 'https://docs.astar.network'
    },
    team: [
      {
        name: 'Sota Watanabe',
        role: 'Founder & CEO',
        twitter: 'https://twitter.com/WatanabeSota'
      }
    ],
    token: {
      symbol: 'ASTR',
      name: 'Astar Token',
      decimals: 18,
      totalSupply: '7000000000',
      price: 0.08,
      marketCap: 560000000,
      holders: 75000
    },
    features: [
      'WebAssembly and EVM support',
      'dApp staking',
      'Cross-chain messaging',
      'Layer 2 solutions',
      'Developer rewards',
      'On-chain governance'
    ],
    integrations: [
      'Polkadot',
      'Ethereum',
      'Acala',
      'Moonbeam'
    ],
    chains: ['polkadot'],
    tags: ['smart-contracts', 'wasm', 'evm', 'infrastructure'],
    isVerified: true,
    isParachain: true,
    parachainId: 2006,
    githubStats: {
      stars: 800,
      forks: 200,
      contributors: 35,
      lastUpdate: '2024-02-10'
    }
  }
];

export async function GET() {
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filter, sort } = body;

    let filteredProjects = [...projects];

    // Apply filters if provided
    if (filter) {
      if (filter.categories?.length) {
        filteredProjects = filteredProjects.filter(p => 
          filter.categories.includes(p.category)
        );
      }

      if (filter.status?.length) {
        filteredProjects = filteredProjects.filter(p => 
          filter.status.includes(p.status)
        );
      }

      if (filter.chains?.length) {
        filteredProjects = filteredProjects.filter(p => 
          p.chains.some(chain => filter.chains.includes(chain))
        );
      }

      if (filter.tags?.length) {
        filteredProjects = filteredProjects.filter(p => 
          p.tags.some(tag => filter.tags.includes(tag))
        );
      }

      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filter.isVerified !== undefined) {
        filteredProjects = filteredProjects.filter(p => 
          p.isVerified === filter.isVerified
        );
      }

      if (filter.isParachain !== undefined) {
        filteredProjects = filteredProjects.filter(p => 
          p.isParachain === filter.isParachain
        );
      }
    }

    // Apply sorting if provided
    if (sort) {
      const { field, direction } = sort;
      filteredProjects.sort((a, b) => {
        const multiplier = direction === 'asc' ? 1 : -1;

        switch (field) {
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
            return multiplier * ((a.token?.marketCap || 0) - (b.token?.marketCap || 0));
          
          default:
            return 0;
        }
      });
    }

    return NextResponse.json({ projects: filteredProjects });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 400 }
    );
  }
} 