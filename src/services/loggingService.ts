import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class LoggingService {
  private static instance: LoggingService;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    
    if (context) {
      entry.context = context;
    }
    
    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const logEntry = this.formatLogEntry(level, message, context);

    // In development, log to console with colors
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      console.log(
        `${colors[level]}[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}${reset}`,
        context || ''
      );
    }

    // In production, send to Sentry based on level
    if (!this.isDevelopment) {
      if (level === 'error') {
        const eventContext = context ? { extra: context } : undefined;
        Sentry.captureException(new Error(message), eventContext);
      } else {
        const breadcrumb: Sentry.Breadcrumb = {
          category: 'log',
          message,
          level: level as Sentry.SeverityLevel,
        };
        
        if (context) {
          breadcrumb.data = context;
        }
        
        Sentry.addBreadcrumb(breadcrumb);
      }
    }

    // Here you could also send logs to other services like CloudWatch, Datadog, etc.
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    } : context;
    this.log('error', message, errorContext);
  }

  // Performance monitoring helper
  async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`Performance measurement: ${name}`, {
        ...context,
        duration_ms: duration,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Performance measurement failed: ${name}`, error as Error, {
        ...context,
        duration_ms: duration,
      });
      throw error;
    }
  }
}

export const loggingService = LoggingService.getInstance(); 