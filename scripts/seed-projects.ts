import fs from 'fs';
import path from 'path';
import type { Project } from '../src/types/ecosystem';

const projects: Project[] = [
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    description: 'Ethereum-compatible smart contract parachain on Polkadot.',
    longDescription: `Moonbeam is a Polkadot parachain that promises Ethereum compatibility. It provides a full EVM implementation, a Web3-compatible API, and bridges that connect Moonbeam to existing Ethereum networks.

The platform enables developers to use existing Ethereum developer tools to target Polkadot, making it easier to deploy existing Solidity smart contracts and DApp frontends with minimal changes.`,
    category: 'infrastructure',
    subcategories: ['smart-contracts', 'evm'],
    status: 'live',
    logo: 'https://raw.githubusercontent.com/polkadot-js/apps/master/packages/apps/public/logos/moonbeam.svg',
    coverImage: 'https://moonbeam.network/wp-content/uploads/2020/03/moonbeam-cover.png',
    launchDate: '2022-01-11',
    stats: {
      tvl: 300000000,
      dailyActiveUsers: 12000,
      totalTransactions: 5000000,
      monthlyVolume: 250000000
    },
    socialLinks: {
      website: 'https://moonbeam.network',
      twitter: 'https://twitter.com/MoonbeamNetwork',
      discord: 'https://discord.gg/moonbeam',
      github: 'https://github.com/PureStake/moonbeam',
      documentation: 'https://docs.moonbeam.network'
    },
    team: [
      {
        name: 'Derek Yoo',
        role: 'CEO',
        twitter: 'https://twitter.com/derekyoo'
      }
    ],
    token: {
      symbol: 'GLMR',
      name: 'Glimmer Token',
      decimals: 18,
      totalSupply: '1000000000',
      price: 0.25,
      marketCap: 250000000,
      holders: 100000
    },
    features: [
      'Full EVM implementation',
      'Web3 API compatibility',
      'Ethereum network integration',
      'Cross-chain bridges',
      'Developer tools',
      'On-chain governance'
    ],
    integrations: [
      'Polkadot',
      'Ethereum',
      'Binance Smart Chain',
      'Astar'
    ],
    chains: ['polkadot'],
    tags: ['smart-contracts', 'evm', 'infrastructure', 'bridges'],
    isVerified: true,
    isParachain: true,
    parachainId: 2004,
    githubStats: {
      stars: 1500,
      forks: 400,
      contributors: 50,
      lastUpdate: '2024-02-12'
    }
  },
  {
    id: 'subscan',
    name: 'Subscan',
    description: 'Multi-network explorer and analytics platform for Substrate-based chains.',
    longDescription: `Subscan is a high-precision multi-network explorer built for Substrate-based chains. It provides comprehensive blockchain data indexing, querying, and visualization services.

The platform offers detailed analytics, custom data API services, and multi-chain support, making it an essential tool for developers and users in the Polkadot ecosystem.`,
    category: 'developer-tools',
    subcategories: ['explorer', 'analytics'],
    status: 'live',
    logo: 'https://raw.githubusercontent.com/polkadot-js/apps/master/packages/apps/public/logos/subscan.svg',
    coverImage: 'https://subscan.io/static/media/subscan-banner.png',
    launchDate: '2020-06-15',
    stats: {
      dailyActiveUsers: 25000,
      totalTransactions: 10000000
    },
    socialLinks: {
      website: 'https://subscan.io',
      twitter: 'https://twitter.com/subscan_io',
      github: 'https://github.com/subscan-explorer',
      documentation: 'https://docs.subscan.io'
    },
    team: [
      {
        name: 'Subscan Team',
        role: 'Development Team'
      }
    ],
    features: [
      'Multi-chain support',
      'Advanced analytics',
      'Custom API services',
      'Real-time data indexing',
      'Rich visualization',
      'Developer tools'
    ],
    integrations: [
      'Polkadot',
      'Kusama',
      'All Parachains'
    ],
    chains: ['polkadot', 'kusama'],
    tags: ['explorer', 'analytics', 'developer-tools', 'infrastructure'],
    isVerified: true,
    isParachain: false,
    githubStats: {
      stars: 300,
      forks: 100,
      contributors: 20,
      lastUpdate: '2024-02-08'
    }
  },
  {
    id: 'subwallet',
    name: 'SubWallet',
    description: 'Multi-chain wallet for the Polkadot and Kusama ecosystems.',
    longDescription: `SubWallet is a comprehensive multi-chain crypto wallet designed specifically for the Polkadot and Kusama ecosystems. It supports all Substrate-based chains and provides seamless integration with DApps.

The wallet offers features like staking, cross-chain transfers, NFT management, and DApp interactions, all with a focus on security and user experience.`,
    category: 'infrastructure',
    subcategories: ['wallet', 'defi'],
    status: 'live',
    logo: 'https://raw.githubusercontent.com/polkadot-js/apps/master/packages/apps/public/logos/subwallet.svg',
    coverImage: 'https://subwallet.app/images/banner.png',
    launchDate: '2021-09-01',
    stats: {
      dailyActiveUsers: 15000,
      totalTransactions: 3000000
    },
    socialLinks: {
      website: 'https://subwallet.app',
      twitter: 'https://twitter.com/subwalletapp',
      telegram: 'https://t.me/subwallet',
      github: 'https://github.com/subwallet',
      documentation: 'https://docs.subwallet.app'
    },
    features: [
      'Multi-chain support',
      'Cross-chain transfers',
      'NFT management',
      'DApp integration',
      'Staking interface',
      'Hardware wallet support'
    ],
    integrations: [
      'Polkadot',
      'Kusama',
      'All Parachains'
    ],
    chains: ['polkadot', 'kusama'],
    tags: ['wallet', 'infrastructure', 'defi', 'nft'],
    isVerified: true,
    isParachain: false,
    githubStats: {
      stars: 200,
      forks: 50,
      contributors: 15,
      lastUpdate: '2024-02-14'
    }
  }
];

async function seedProjects() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/projects.json');
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
    console.log('Successfully seeded projects data');
  } catch (error) {
    console.error('Failed to seed projects:', error);
    process.exit(1);
  }
}

seedProjects(); 