interface EnvVar {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const envVars: EnvVar[] = [
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    validator: (value) => /^[0-9a-f]{64}$/.test(value),
    errorMessage: 'ENCRYPTION_KEY must be a 64-character hexadecimal string'
  },
  {
    name: 'CSRF_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'CSRF_SECRET must be at least 32 characters long'
  },
  {
    name: 'COINGECKO_API_KEY',
    required: false,
    validator: (value) => /^[A-Za-z0-9-_]+$/.test(value),
    errorMessage: 'COINGECKO_API_KEY must contain only alphanumeric characters, hyphens, and underscores'
  },
  {
    name: 'SUBSCAN_API_KEY',
    required: true,
    validator: (value) => /^[A-Za-z0-9-_]+$/.test(value),
    errorMessage: 'SUBSCAN_API_KEY must contain only alphanumeric characters, hyphens, and underscores'
  },
  {
    name: 'NODE_ENV',
    required: true,
    validator: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be either development, production, or test'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'NEXT_PUBLIC_APP_URL must be a valid URL'
  }
];

class EnvValidator {
  private static instance: EnvValidator;

  private constructor() {}

  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator();
    }
    return EnvValidator.instance;
  }

  validateEnv(): void {
    const errors: string[] = [];

    for (const envVar of envVars) {
      const value = process.env[envVar.name];

      if (envVar.required && !value) {
        errors.push(`Missing required environment variable: ${envVar.name}`);
        continue;
      }

      if (value && envVar.validator && !envVar.validator(value)) {
        errors.push(envVar.errorMessage || `Invalid value for ${envVar.name}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
}

export const envValidator = EnvValidator.getInstance(); 