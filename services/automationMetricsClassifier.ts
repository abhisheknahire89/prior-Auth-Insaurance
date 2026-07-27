/**
 * services/automationMetricsClassifier.ts
 *
 * Classifies every populated field into 7 automation categories:
 * 1. MANUAL - user typed manually
 * 2. OCR - extracted from document via OCR
 * 3. AI_GENERATED - LLM-produced (Gemini/Groq)
 * 4. RULE_ENGINE - calculated from rules
 * 5. CALCULATED - mathematical formula result
 * 6. COPIED - duplicated from another field
 * 7. SYSTEM_DEFAULT - system-provided default value
 */

export enum AutomationCategory {
  MANUAL = 'MANUAL',
  OCR = 'OCR',
  AI_GENERATED = 'AI_GENERATED',
  RULE_ENGINE = 'RULE_ENGINE',
  CALCULATED = 'CALCULATED',
  COPIED = 'COPIED',
  SYSTEM_DEFAULT = 'SYSTEM_DEFAULT'
}

export interface FieldMetric {
  fieldName: string;
  category: AutomationCategory;
  value: string | number;
  confidence?: number; // 0-100 for OCR and AI
  source?: string; // where the value came from
  timestamp: Date;
}

export interface AutomationReport {
  totalFields: number;
  categoryCounts: Record<AutomationCategory, number>;
  automationRate: number; // percentage of non-manual fields
  details: FieldMetric[];
}

class AutomationMetricsClassifier {
  private metrics: FieldMetric[] = [];

  /**
   * Track a manually entered field
   */
  addManualField(fieldName: string, value: string | number): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.MANUAL,
      value,
      timestamp: new Date()
    });
  }

  /**
   * Track an OCR-extracted field
   */
  addOcrField(fieldName: string, value: string | number, confidence: number, source: string): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.OCR,
      value,
      confidence: Math.round(confidence * 100), // normalize to 0-100
      source,
      timestamp: new Date()
    });
  }

  /**
   * Track an AI-generated field
   */
  addAiGeneratedField(fieldName: string, value: string | number, confidence: number, model: string): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.AI_GENERATED,
      value,
      confidence: Math.round(confidence * 100),
      source: `LLM: ${model}`,
      timestamp: new Date()
    });
  }

  /**
   * Track a rule-engine calculated field
   */
  addRuleEngineField(fieldName: string, value: string | number, ruleName: string): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.RULE_ENGINE,
      value,
      source: `Rule: ${ruleName}`,
      timestamp: new Date()
    });
  }

  /**
   * Track a mathematically calculated field
   */
  addCalculatedField(fieldName: string, value: number, formula: string): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.CALCULATED,
      value,
      source: `Formula: ${formula}`,
      timestamp: new Date()
    });
  }

  /**
   * Track a field copied from another field
   */
  addCopiedField(fieldName: string, value: string | number, sourceField: string): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.COPIED,
      value,
      source: `Copied from: ${sourceField}`,
      timestamp: new Date()
    });
  }

  /**
   * Track a system-provided default value
   */
  addSystemDefaultField(fieldName: string, value: string | number, reason: string): void {
    this.metrics.push({
      fieldName,
      category: AutomationCategory.SYSTEM_DEFAULT,
      value,
      source: `Default: ${reason}`,
      timestamp: new Date()
    });
  }

  /**
   * Calculate automation rate
   * Formula: (OCR + AI_GENERATED + RULE_ENGINE + CALCULATED + COPIED + SYSTEM_DEFAULT) / Total × 100%
   */
  calculateAutomationRate(): number {
    if (this.metrics.length === 0) return 0;

    const automatedCount = this.metrics.filter(m =>
      m.category !== AutomationCategory.MANUAL
    ).length;

    return Math.round((automatedCount / this.metrics.length) * 100);
  }

  /**
   * Generate comprehensive automation report
   */
  generateReport(): AutomationReport {
    const categoryCounts: Record<AutomationCategory, number> = {
      [AutomationCategory.MANUAL]: 0,
      [AutomationCategory.OCR]: 0,
      [AutomationCategory.AI_GENERATED]: 0,
      [AutomationCategory.RULE_ENGINE]: 0,
      [AutomationCategory.CALCULATED]: 0,
      [AutomationCategory.COPIED]: 0,
      [AutomationCategory.SYSTEM_DEFAULT]: 0
    };

    // Count by category
    this.metrics.forEach(metric => {
      categoryCounts[metric.category]++;
    });

    return {
      totalFields: this.metrics.length,
      categoryCounts,
      automationRate: this.calculateAutomationRate(),
      details: this.metrics
    };
  }

  /**
   * Get formatted report for display
   */
  getFormattedReport(): string {
    const report = this.generateReport();
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('AUTOMATION METRICS REPORT');
    lines.push('='.repeat(70));

    lines.push(`\nTOTAL FIELDS: ${report.totalFields}`);
    lines.push(`AUTOMATION RATE: ${report.automationRate}%`);

    lines.push('\nBREAKDOWN BY CATEGORY:');
    lines.push('-'.repeat(70));

    Object.entries(report.categoryCounts).forEach(([category, count]) => {
      const percentage = Math.round((count / report.totalFields) * 100);
      lines.push(`${category.padEnd(20)} ${count.toString().padStart(3)} fields (${percentage}%)`);
    });

    lines.push('\nDETAILED FIELD LIST:');
    lines.push('-'.repeat(70));

    report.details.forEach(field => {
      const confidenceStr = field.confidence ? ` [${field.confidence}%]` : '';
      const sourceStr = field.source ? ` - ${field.source}` : '';
      lines.push(`${field.fieldName.padEnd(25)} ${field.category.padEnd(18)} ${confidenceStr}${sourceStr}`);
    });

    lines.push('='.repeat(70));

    return lines.join('\n');
  }

  /**
   * Reset metrics (for new case)
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * Export for database storage
   */
  export(): FieldMetric[] {
    return [...this.metrics];
  }
}

export const automationClassifier = new AutomationMetricsClassifier();
