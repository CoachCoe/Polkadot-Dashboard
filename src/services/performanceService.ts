import { Metric, onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import { loggingService } from './loggingService';

declare global {
  interface Window {
    gtag?: (command: string, action: string, params: any) => void;
  }
}

class PerformanceService {
  private static instance: PerformanceService;

  private constructor() {
    // Initialize performance monitoring
    this.initWebVitals();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initWebVitals() {
    onCLS(this.handleWebVital);
    onFCP(this.handleWebVital);
    onLCP(this.handleWebVital);
    onTTFB(this.handleWebVital);
  }

  private handleWebVital = (metric: Metric) => {
    const body = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    // Log the metric
    loggingService.info(`Web Vital: ${metric.name}`, body);

    // You could also send this to your analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', body);
    }
  };

  // Custom performance measurements
  async measurePageLoad(pageName: string) {
    if (typeof window === 'undefined') return;

    const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigationTiming) return;

    const metrics = {
      page: pageName,
      dnsLookup: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
      tcpConnection: navigationTiming.connectEnd - navigationTiming.connectStart,
      serverResponse: navigationTiming.responseStart - navigationTiming.requestStart,
      domComplete: navigationTiming.domComplete - navigationTiming.responseEnd,
      loadEvent: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
      totalPageLoad: navigationTiming.loadEventEnd - navigationTiming.startTime,
    };

    loggingService.info(`Page Load Performance: ${pageName}`, metrics);
  }

  // Resource timing
  measureResourceTiming() {
    if (typeof window === 'undefined') return;

    const resources = window.performance.getEntriesByType('resource');
    const metrics = resources.map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize,
    }));

    loggingService.info('Resource Timing', { resources: metrics });
  }

  // Custom performance mark
  mark(name: string) {
    if (typeof window === 'undefined') return;
    performance.mark(name);
  }

  // Measure between marks
  measure(name: string, startMark: string, endMark: string) {
    if (typeof window === 'undefined') return;
    
    try {
      const measure = performance.measure(name, startMark, endMark);
      loggingService.info(`Performance Measure: ${name}`, {
        duration: measure.duration,
        startTime: measure.startTime,
        detail: measure.detail,
      });
    } catch (error) {
      loggingService.error(`Failed to measure performance: ${name}`, error as Error);
    }
  }

  // Clear marks and measures
  clearMarks() {
    if (typeof window === 'undefined') return;
    performance.clearMarks();
  }

  clearMeasures() {
    if (typeof window === 'undefined') return;
    performance.clearMeasures();
  }
}

export const performanceService = PerformanceService.getInstance(); 