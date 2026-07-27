/**
 * services/performanceTelemetry.ts
 *
 * Real-time performance telemetry using performance.now()
 * Measures all workflow stages with actual millisecond precision
 */

interface PerformanceMarker {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceTelemetry {
  private markers: Map<string, PerformanceMarker> = new Map();
  private caseId: string = '';

  /**
   * Initialize telemetry for a case
   */
  initializeCase(caseId: string): void {
    this.caseId = caseId;
    this.markers.clear();

    // Start workflow marker
    this.mark('workflow_start', performance.now());
  }

  /**
   * Mark start of operation
   */
  mark(label: string, timestamp?: number): number {
    const time = timestamp || performance.now();

    if (this.markers.has(label)) {
      console.warn(`Marker ${label} already exists, creating new one with suffix`);
    }

    this.markers.set(label, {
      name: label,
      startTime: time
    });

    return time;
  }

  /**
   * Mark end of operation and calculate duration
   */
  markEnd(label: string, timestamp?: number): number {
    const endTime = timestamp || performance.now();
    const marker = this.markers.get(label);

    if (!marker) {
      console.error(`Marker ${label} not found`);
      return 0;
    }

    marker.endTime = endTime;
    marker.duration = endTime - marker.startTime;

    console.log(`[PERF] ${label}: ${marker.duration.toFixed(2)}ms`);

    return marker.duration;
  }

  /**
   * Get all timing data collected
   */
  getTimings(): Record<string, { duration: number; ms: number }> {
    const timings: Record<string, { duration: number; ms: number }> = {};

    this.markers.forEach((marker, key) => {
      if (marker.duration !== undefined) {
        const durationSec = (marker.duration / 1000).toFixed(2);
        timings[key] = {
          duration: parseFloat(durationSec),
          ms: Math.round(marker.duration)
        };
      }
    });

    return timings;
  }

  /**
   * Format duration as human-readable string
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)} ms`;
    }
    return `${(ms / 1000).toFixed(2)} sec`;
  }

  /**
   * Get formatted summary of all timings
   */
  getSummary(): string {
    const timings = this.getTimings();
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('PERFORMANCE TELEMETRY SUMMARY');
    lines.push('='.repeat(60));

    Object.entries(timings).forEach(([label, timing]) => {
      lines.push(`${label.padEnd(40)} ${timing.ms.toString().padStart(6)} ms  (${timing.duration}s)`);
    });

    lines.push('='.repeat(60));

    // Calculate workflow total
    const workflowStart = this.markers.get('workflow_start');
    const workflowEnd = this.markers.get('workflow_end');
    if (workflowStart && workflowEnd?.endTime) {
      const total = workflowEnd.endTime - workflowStart.startTime;
      lines.push(`TOTAL WORKFLOW TIME: ${this.formatDuration(total)}`);
    }

    return lines.join('\n');
  }

  /**
   * Store timings to database (for API call)
   */
  async storeTimings(apiCall: (action: string, args: any) => Promise<void>): Promise<void> {
    const timings = this.getTimings();

    for (const [label, timing] of Object.entries(timings)) {
      await apiCall('savePerformanceMetrics', {
        id: `perf-${this.caseId}-${label}`,
        caseId: this.caseId,
        stepName: label,
        startTime: new Date(performance.now() - timing.ms).toISOString(),
        endTime: new Date(performance.now()).toISOString(),
        duration: timing.ms
      });
    }
  }

  /**
   * Get marker duration without formatting
   */
  getDuration(label: string): number {
    const marker = this.markers.get(label);
    return marker?.duration || 0;
  }
}

export const performanceTelemetry = new PerformanceTelemetry();

/**
 * Browser-compatible performance measurement
 * Usage in React components:
 *
 * useEffect(() => {
 *   performanceTelemetry.mark('step1_start');
 *   return () => {
 *     performanceTelemetry.markEnd('step1_start');
 *   };
 * }, []);
 */
