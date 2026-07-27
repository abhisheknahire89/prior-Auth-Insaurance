/**
 * services/apiTelemetry.ts
 *
 * Comprehensive API call tracking with:
 * - Provider name (Gemini, Groq, Sarvam, etc.)
 * - Model name
 * - Start/End timestamps
 * - Latency (milliseconds)
 * - Retry count and backoff strategy
 * - Success/Failure status
 * - Token usage (input/output)
 * - Fallback usage (if primary failed)
 *
 * Every API call is recorded for observability and debugging.
 */

export enum ApiProvider {
  GEMINI = 'GEMINI',
  GROQ = 'GROQ',
  SARVAM = 'SARVAM',
  GOOGLE_VISION = 'GOOGLE_VISION',
  AWS_TEXTRACT = 'AWS_TEXTRACT',
  CARRIER_API = 'CARRIER_API',
  DATABASE = 'DATABASE'
}

export interface ApiCallMetric {
  id: string;
  caseId: string;
  provider: ApiProvider;
  model: string;
  endpoint: string;
  startTime: Date;
  endTime: Date;
  latencyMs: number;
  retryCount: number;
  retryReason?: string;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  fallbackUsed: boolean;
  fallbackProvider?: ApiProvider;
  fallbackLatencyMs?: number;
  requestSize?: number; // bytes
  responseSize?: number; // bytes
  requestHash?: string; // for deduplication
  userId?: string;
  source?: string; // which service/component called
}

class ApiTelemetry {
  private metrics: ApiCallMetric[] = [];
  private callStack: Map<string, number> = new Map(); // track ongoing calls

  /**
   * Record start of API call
   */
  recordApiStart(callId: string, provider: ApiProvider, model: string, endpoint: string): number {
    const startTime = performance.now();
    this.callStack.set(callId, startTime);
    console.log(`[API] ${provider} → ${model} @ ${endpoint}`);
    return startTime;
  }

  /**
   * Record successful API call
   */
  recordApiSuccess(
    callId: string,
    caseId: string,
    provider: ApiProvider,
    model: string,
    endpoint: string,
    options: {
      retryCount?: number;
      inputTokens?: number;
      outputTokens?: number;
      responseSize?: number;
      userId?: string;
      source?: string;
    } = {}
  ): ApiCallMetric {
    const startTime = this.callStack.get(callId) || performance.now();
    const endTime = performance.now();
    const latencyMs = endTime - startTime;

    const metric: ApiCallMetric = {
      id: callId,
      caseId,
      provider,
      model,
      endpoint,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      latencyMs: Math.round(latencyMs),
      retryCount: options.retryCount || 0,
      success: true,
      statusCode: 200,
      inputTokens: options.inputTokens,
      outputTokens: options.outputTokens,
      totalTokens: (options.inputTokens || 0) + (options.outputTokens || 0),
      fallbackUsed: false,
      responseSize: options.responseSize,
      userId: options.userId,
      source: options.source
    };

    this.metrics.push(metric);
    this.callStack.delete(callId);

    console.log(`  ✅ Success: ${latencyMs.toFixed(0)}ms | Tokens: ${metric.totalTokens || 'N/A'}`);

    return metric;
  }

  /**
   * Record failed API call with retry
   */
  recordApiFailure(
    callId: string,
    caseId: string,
    provider: ApiProvider,
    model: string,
    endpoint: string,
    options: {
      statusCode?: number;
      errorMessage: string;
      retryCount?: number;
      retryReason?: string;
      userId?: string;
      source?: string;
    }
  ): ApiCallMetric {
    const startTime = this.callStack.get(callId) || performance.now();
    const endTime = performance.now();
    const latencyMs = endTime - startTime;

    const metric: ApiCallMetric = {
      id: callId,
      caseId,
      provider,
      model,
      endpoint,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      latencyMs: Math.round(latencyMs),
      retryCount: options.retryCount || 0,
      retryReason: options.retryReason,
      success: false,
      statusCode: options.statusCode,
      errorMessage: options.errorMessage,
      fallbackUsed: false,
      userId: options.userId,
      source: options.source
    };

    this.metrics.push(metric);
    this.callStack.delete(callId);

    console.log(`  ❌ Failed: ${options.errorMessage} (${latencyMs.toFixed(0)}ms)`);

    return metric;
  }

  /**
   * Record fallback provider call
   */
  recordFallback(
    callId: string,
    caseId: string,
    primaryProvider: ApiProvider,
    fallbackProvider: ApiProvider,
    model: string,
    endpoint: string,
    options: {
      primaryLatencyMs: number;
      fallbackLatencyMs: number;
      fallbackSuccess: boolean;
      inputTokens?: number;
      outputTokens?: number;
      userId?: string;
      source?: string;
    }
  ): void {
    // Update or create metric
    let metric = this.metrics.find(m => m.id === callId);

    if (!metric) {
      metric = {
        id: callId,
        caseId,
        provider: primaryProvider,
        model,
        endpoint,
        startTime: new Date(performance.now() - options.primaryLatencyMs - options.fallbackLatencyMs),
        endTime: new Date(),
        latencyMs: options.primaryLatencyMs + options.fallbackLatencyMs,
        retryCount: 1,
        success: options.fallbackSuccess,
        statusCode: options.fallbackSuccess ? 200 : 503,
        fallbackUsed: true,
        fallbackProvider,
        fallbackLatencyMs: options.fallbackLatencyMs,
        inputTokens: options.inputTokens,
        outputTokens: options.outputTokens,
        totalTokens: (options.inputTokens || 0) + (options.outputTokens || 0),
        userId: options.userId,
        source: options.source
      };
      this.metrics.push(metric);
    } else {
      metric.fallbackUsed = true;
      metric.fallbackProvider = fallbackProvider;
      metric.fallbackLatencyMs = options.fallbackLatencyMs;
      metric.latencyMs += options.fallbackLatencyMs;
      metric.success = options.fallbackSuccess;
    }

    this.callStack.delete(callId);

    console.log(`  🔄 Fallback to ${fallbackProvider}: ${options.fallbackLatencyMs.toFixed(0)}ms`);
  }

  /**
   * Get all recorded API calls
   */
  getAllCalls(): ApiCallMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific case
   */
  getCaseMetrics(caseId: string): ApiCallMetric[] {
    return this.metrics.filter(m => m.caseId === caseId);
  }

  /**
   * Get provider statistics
   */
  getProviderStats(provider: ApiProvider) {
    const providerCalls = this.metrics.filter(m => m.provider === provider);

    return {
      provider,
      totalCalls: providerCalls.length,
      successCount: providerCalls.filter(m => m.success).length,
      failureCount: providerCalls.filter(m => !m.success).length,
      successRate: Math.round((providerCalls.filter(m => m.success).length / providerCalls.length) * 100),
      averageLatencyMs: Math.round(
        providerCalls.reduce((sum, m) => sum + m.latencyMs, 0) / providerCalls.length
      ),
      totalTokens: providerCalls.reduce((sum, m) => sum + (m.totalTokens || 0), 0),
      fallbackCount: providerCalls.filter(m => m.fallbackUsed).length
    };
  }

  /**
   * Generate API metrics report
   */
  generateReport(): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('API TELEMETRY REPORT');
    lines.push('='.repeat(80));

    lines.push(`\nTOTAL API CALLS: ${this.metrics.length}`);

    const providers = [...new Set(this.metrics.map(m => m.provider))];
    lines.push('\nPROVIDER STATISTICS:');
    lines.push('-'.repeat(80));

    for (const provider of providers) {
      const stats = this.getProviderStats(provider);
      lines.push(`\n${provider}:`);
      lines.push(`  Total Calls: ${stats.totalCalls}`);
      lines.push(`  Success Rate: ${stats.successRate}% (${stats.successCount}/${stats.totalCalls})`);
      lines.push(`  Average Latency: ${stats.averageLatencyMs}ms`);
      lines.push(`  Total Tokens: ${stats.totalTokens.toLocaleString()}`);
      if (stats.fallbackCount > 0) {
        lines.push(`  Fallback Count: ${stats.fallbackCount}`);
      }
    }

    lines.push('\n' + '-'.repeat(80));
    lines.push('DETAILED CALL LOG:');
    lines.push('-'.repeat(80));

    this.metrics.forEach((metric, idx) => {
      const status = metric.success ? '✅' : '❌';
      const fallback = metric.fallbackUsed ? ` [${metric.fallbackProvider}]` : '';
      const tokens = metric.totalTokens ? ` | Tokens: ${metric.totalTokens}` : '';
      lines.push(
        `${idx + 1}. ${status} ${metric.provider}/${metric.model} → ${metric.latencyMs}ms${tokens}${fallback}`
      );
    });

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Export metrics for database storage
   */
  export() {
    return this.metrics.map(metric => ({
      id: metric.id,
      caseId: metric.caseId,
      provider: metric.provider,
      model: metric.model,
      endpoint: metric.endpoint,
      startTime: metric.startTime.toISOString(),
      endTime: metric.endTime.toISOString(),
      latencyMs: metric.latencyMs,
      retryCount: metric.retryCount,
      success: metric.success,
      statusCode: metric.statusCode,
      errorMessage: metric.errorMessage,
      inputTokens: metric.inputTokens,
      outputTokens: metric.outputTokens,
      totalTokens: metric.totalTokens,
      fallbackUsed: metric.fallbackUsed,
      fallbackProvider: metric.fallbackProvider,
      fallbackLatencyMs: metric.fallbackLatencyMs,
      userId: metric.userId,
      source: metric.source
    }));
  }

  /**
   * Reset for new test
   */
  reset(): void {
    this.metrics = [];
    this.callStack.clear();
  }
}

export const apiTelemetry = new ApiTelemetry();
