/**
 * services/metricsService.ts
 *
 * Comprehensive metrics tracking service for Prior Authorization workflow.
 * Tracks: workflow progress, performance, extraction accuracy, automation,
 * validation, clinical completeness, billing, coding, OCR, AI, claim readiness,
 * audit trail, API performance, and errors.
 */

import { v4 as uuidv4 } from 'uuid';
import { utils } from './api';

interface MetricsPayload {
  action: string;
  args: any;
}

class MetricsService {
  private caseId: string = '';
  private workflowStartTime: number = 0;
  private stepTimings: Map<string, number> = new Map();
  private extractionFields: Map<string, any> = new Map();
  private automationFields: Map<string, string> = new Map();
  private isBrowser: boolean = typeof window !== 'undefined';

  /**
   * Initialize metrics for a case
   */
  initializeCase(caseId: string) {
    this.caseId = caseId;
    this.workflowStartTime = performance.now?.() || Date.now();
    this.stepTimings.clear();
    this.extractionFields.clear();
    this.automationFields.clear();
  }

  /**
   * Track workflow progress
   */
  async trackWorkflowProgress(
    workflowName: string,
    status: string,
    currentStep: string,
    completedSteps: number,
    totalSteps: number
  ) {
    if (!this.caseId) return;

    const duration = (performance.now?.() || Date.now()) - this.workflowStartTime;
    const completionRate = (completedSteps / totalSteps) * 100;

    const payload: MetricsPayload = {
      action: 'saveWorkflowMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        workflowName,
        status,
        currentStep,
        completedSteps,
        totalSteps,
        startTime: new Date(this.workflowStartTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.round(duration),
        completionRate
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track performance for each step using Performance API
   */
  async trackStepPerformance(stepName: string, duration: number) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'savePerformanceMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        stepName,
        startTime: new Date(Date.now() - duration).toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.round(duration)
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Mark start of a performance measurement
   */
  markStepStart(stepName: string) {
    if (!this.isBrowser || !performance.mark) return;
    performance.mark(`${stepName}-start`);
  }

  /**
   * Mark end of a performance measurement and calculate duration
   */
  async markStepEnd(stepName: string) {
    if (!this.isBrowser || !performance.mark || !performance.measure) return;

    performance.mark(`${stepName}-end`);
    try {
      performance.measure(stepName, `${stepName}-start`, `${stepName}-end`);
      const measure = performance.getEntriesByName(stepName)[0] as PerformanceEntryWithDuration;
      if (measure) {
        await this.trackStepPerformance(stepName, measure.duration);
      }
    } catch (e) {
      // Measurement failed, skip
    }
  }

  /**
   * Track extracted field accuracy
   */
  async trackExtractedField(
    fieldName: string,
    source: string,
    extractedValue: any,
    expectedValue: any,
    confidence: number,
    verified: boolean,
    status: string
  ) {
    if (!this.caseId) return;

    this.extractionFields.set(fieldName, {
      extracted: extractedValue,
      expected: expectedValue,
      confidence,
      verified,
      status
    });

    const payload: MetricsPayload = {
      action: 'saveExtractionMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        fieldName,
        source,
        extractedValue: JSON.stringify(extractedValue),
        expectedValue: JSON.stringify(expectedValue),
        confidence,
        verified,
        status
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Calculate extraction accuracy
   */
  getExtractionAccuracy(): {
    correctFields: number;
    incorrectFields: number;
    missingFields: number;
    accuracy: number;
  } {
    let correct = 0;
    let incorrect = 0;
    let missing = 0;

    this.extractionFields.forEach((field) => {
      if (field.status === 'correct') correct++;
      else if (field.status === 'incorrect') incorrect++;
      else if (field.status === 'missing') missing++;
    });

    const total = correct + incorrect + missing;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    return {
      correctFields: correct,
      incorrectFields: incorrect,
      missingFields: missing,
      accuracy: Math.round(accuracy * 10) / 10
    };
  }

  /**
   * Track automation metrics
   * fillType: 'auto_filled' | 'copied' | 'derived' | 'calculated' | 'manual'
   */
  async trackAutomationField(fieldName: string, fillType: string, value: any) {
    if (!this.caseId) return;

    this.automationFields.set(fieldName, fillType);

    const payload: MetricsPayload = {
      action: 'saveAutomationMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        fieldName,
        fillType,
        value: JSON.stringify(value)
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Calculate automation rate
   * Automation Rate = (Auto Filled + Calculated + Derived) / Total Fields
   */
  getAutomationRate(): {
    autoFilled: number;
    calculated: number;
    derived: number;
    manual: number;
    automationRate: number;
  } {
    let autoFilled = 0;
    let calculated = 0;
    let derived = 0;
    let manual = 0;

    this.automationFields.forEach((fillType) => {
      if (fillType === 'auto_filled') autoFilled++;
      else if (fillType === 'calculated') calculated++;
      else if (fillType === 'derived') derived++;
      else if (fillType === 'manual') manual++;
    });

    const total = autoFilled + calculated + derived + manual;
    const automationRate = total > 0 ? ((autoFilled + calculated + derived) / total) * 100 : 0;

    return {
      autoFilled,
      calculated,
      derived,
      manual,
      automationRate: Math.round(automationRate * 10) / 10
    };
  }

  /**
   * Track validation results
   */
  async trackValidation(
    validationType: string,
    field: string,
    result: string,
    errorMessage?: string,
    severity?: string
  ) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveValidationMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        validationType,
        field,
        result,
        errorMessage,
        severity
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track clinical section completeness
   */
  async trackClinicalSection(
    section: string,
    status: 'present' | 'missing' | 'incomplete',
    details?: any
  ) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveClinicalMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        section,
        status,
        details
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track billing metrics
   */
  async trackBillingMetrics(billingData: {
    hospitalBill: number;
    estimatedBill: number;
    difference: number;
    reason?: string;
    policyLimit: number;
    coverage: number;
    deduction: number;
    violation?: string;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveBillingMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...billingData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track ICD coding
   */
  async trackCodingMetrics(codingData: {
    diagnosis: string;
    icdSuggested: string;
    icdSelected: string;
    method: string;
    confidence: string;
    manualOverride?: boolean;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveCodingMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...codingData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track OCR performance
   */
  async trackOcrMetrics(ocrData: {
    uploadTime: number;
    ocrTime: number;
    pageCount: number;
    confidence: number;
    retryCount: number;
    failures?: string;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveOcrMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...ocrData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track AI/LLM call metrics
   */
  async trackAiMetrics(aiData: {
    model: string;
    prompt: string;
    latency: number;
    tokenCount: number;
    fallback?: string;
    confidence: number;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveAiMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...aiData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Calculate and save claim readiness score
   * Based on rule engine with weighted components
   */
  async calculateAndSaveClaimReadiness(claimData: {
    chiefComplaint: number;
    diagnosis: number;
    treatment: number;
    policy: number;
    bill: number;
    investigations: number;
    medicalNecessity: number;
    insurance: number;
    consent: number;
  }) {
    if (!this.caseId) return;

    const maxScore = 100;
    const weights = {
      chiefComplaint: 10,
      diagnosis: 10,
      treatment: 10,
      policy: 10,
      bill: 10,
      investigations: 10,
      medicalNecessity: 20,
      insurance: 10,
      consent: 10
    };

    let score = 0;
    const gaps: string[] = [];

    if (claimData.chiefComplaint < 10) { score += claimData.chiefComplaint; gaps.push('Chief Complaint incomplete'); }
    else score += weights.chiefComplaint;

    if (claimData.diagnosis < 10) { score += claimData.diagnosis; gaps.push('Diagnosis incomplete'); }
    else score += weights.diagnosis;

    if (claimData.treatment < 10) { score += claimData.treatment; gaps.push('Treatment Plan incomplete'); }
    else score += weights.treatment;

    if (claimData.policy < 10) { score += claimData.policy; gaps.push('Policy validation pending'); }
    else score += weights.policy;

    if (claimData.bill < 10) { score += claimData.bill; gaps.push('Bill verification pending'); }
    else score += weights.bill;

    if (claimData.investigations < 10) { score += claimData.investigations; gaps.push('Investigations incomplete'); }
    else score += weights.investigations;

    if (claimData.medicalNecessity < 20) { score += claimData.medicalNecessity; gaps.push(`Medical Necessity weak (${claimData.medicalNecessity}/20)`); }
    else score += weights.medicalNecessity;

    if (claimData.insurance < 10) { score += claimData.insurance; gaps.push('Insurance validation pending'); }
    else score += weights.insurance;

    if (claimData.consent < 10) { score += claimData.consent; gaps.push('Consent missing'); }
    else score += weights.consent;

    const breakdown = {
      chiefComplaint: claimData.chiefComplaint,
      diagnosis: claimData.diagnosis,
      treatment: claimData.treatment,
      policy: claimData.policy,
      bill: claimData.bill,
      investigations: claimData.investigations,
      medicalNecessity: claimData.medicalNecessity,
      insurance: claimData.insurance,
      consent: claimData.consent
    };

    const payload: MetricsPayload = {
      action: 'saveClaimReadiness',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        score: Math.round(score),
        maxScore,
        breakdown,
        gaps
      }
    };

    await this.saveMetrics(payload);

    return {
      score: Math.round(score),
      maxScore,
      breakdown,
      gaps
    };
  }

  /**
   * Log audit trail entry
   */
  async logAudit(auditData: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    source?: string;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveAuditLog',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...auditData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track API call metrics
   */
  async trackApiCall(apiData: {
    service: string;
    endpoint: string;
    method: string;
    latency: number;
    statusCode: number;
    success: boolean;
    retryCount: number;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveApiMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...apiData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Track error metrics
   */
  async trackError(errorData: {
    errorType: string;
    message: string;
    severity: string;
    recovered: boolean;
    recoveryMethod?: string;
  }) {
    if (!this.caseId) return;

    const payload: MetricsPayload = {
      action: 'saveErrorMetrics',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...errorData
      }
    };

    await this.saveMetrics(payload);
  }

  /**
   * Calculate and save pilot readiness score
   */
  async calculatePilotReadinessScore(assessment: {
    workflowScore: number; // 0-25 (all 4 steps working)
    securityScore: number; // 0-15 (auth, encryption, audit)
    auditScore: number; // 0-15 (logging, trail)
    monitoringScore: number; // 0-15 (performance, errors)
    performanceScore: number; // 0-15 (response times)
    carrierScore: number; // 0-10 (integration ready)
    testingScore: number; // 0-10 (multi-case tested)
  }) {
    if (!this.caseId) return;

    const overallScore =
      assessment.workflowScore +
      assessment.securityScore +
      assessment.auditScore +
      assessment.monitoringScore +
      assessment.performanceScore +
      assessment.carrierScore +
      assessment.testingScore;

    let recommendation = 'Development';
    if (overallScore >= 85) recommendation = 'Production Ready';
    else if (overallScore >= 70) recommendation = 'Pilot Ready';
    else if (overallScore >= 50) recommendation = 'MVP Ready';
    else recommendation = 'Development Prototype';

    const payload: MetricsPayload = {
      action: 'savePilotReadinessScore',
      args: {
        id: uuidv4(),
        caseId: this.caseId,
        ...assessment,
        overallScore,
        recommendation
      }
    };

    await this.saveMetrics(payload);

    return {
      ...assessment,
      overallScore,
      recommendation
    };
  }

  /**
   * Save metrics to database via API
   */
  private async saveMetrics(payload: MetricsPayload) {
    try {
      if (this.isBrowser) {
        // Browser: use fetch
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Server: use axios
        await utils.api.post('/api/db', payload);
      }
    } catch (err) {
      console.warn('Failed to save metrics:', err);
      // Non-blocking: metrics failure should not break workflow
    }
  }
}

export const metricsService = new MetricsService();

// Type for performance measurement with duration
interface PerformanceEntryWithDuration extends PerformanceEntry {
  duration: number;
}
