export const APP_CONFIG = {
  BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
  API_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  STAKING: '/staking',
  GOVERNANCE: '/governance',
  ECOSYSTEM: '/ecosystem',
  ROADMAP: '/roadmap',
  PERFORMANCE: '/performance',
  SETTINGS: '/settings',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  ECOSYSTEM: '/api/ecosystem',
  GOVERNANCE: '/api/governance',
  PROXY: '/api/proxy',
  PERFORMANCE: '/api/performance',
} as const;

export const ERROR_MESSAGES = {
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_INPUT: 'Invalid input provided.',
  NO_ACCOUNTS_FOUND: 'No accounts found. Please create an account in your wallet extension.',
} as const; 