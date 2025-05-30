import { APP_CONFIG } from '@/config/constants';

class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  get basePath(): string {
    return APP_CONFIG.BASE_PATH;
  }

  get apiTimeout(): number {
    return APP_CONFIG.API_TIMEOUT;
  }

  get maxRetryAttempts(): number {
    return APP_CONFIG.MAX_RETRY_ATTEMPTS;
  }

  get retryDelay(): number {
    return APP_CONFIG.RETRY_DELAY;
  }

  get cacheDuration(): number {
    return APP_CONFIG.CACHE_DURATION;
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}

export const configService = ConfigService.getInstance(); 