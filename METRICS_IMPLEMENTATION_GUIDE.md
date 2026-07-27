# Metrics Implementation Guide

## Overview

A comprehensive metrics system has been implemented to track, measure, and validate every aspect of the Prior Authorization workflow. This replaces estimates and claims with **real, measured data**.

---

## What's Been Implemented

### 1. Database Schema (18 Metrics Tables)

All metrics are persisted in SQLite:

```
workflow_metrics           - Workflow progress and completion
performance_metrics        - Step-by-step performance timings
extraction_metrics         - Field extraction accuracy
automation_metrics         - Field automation tracking
validation_metrics         - Validation rule results
clinical_metrics           - Clinical section completeness
billing_metrics            - Billing validation
coding_metrics             - ICD-10 coding records
ocr_metrics                - OCR performance
ai_metrics                 - LLM call tracking
claim_readiness_metrics    - Claim readiness scores
audit_log                  - Complete audit trail
api_metrics                - External API performance
error_metrics              - Error tracking and recovery
pilot_readiness_scores     - Production readiness assessment
```

### 2. Metrics Service (`services/metricsService.ts`)

Provides high-level API for tracking metrics:

```typescript
import { metricsService } from './services/metricsService';

// Initialize for a case
metricsService.initializeCase('PA-AIVANA-20260727-7420');

// Track workflow progress
await metricsService.trackWorkflowProgress(
  'Prior Authorization',
  'in_progress',
  'Clinical Details',
  2,  // completed steps
  4   // total steps
);

// Performance tracking
metricsService.markStepStart('PatientInsurance');
// ... do work ...
await metricsService.markStepEnd('PatientInsurance');

// Track extracted fields
await metricsService.trackExtractedField(
  'patientName',
  'document',
  'A. Paramesh',
  'A. Paramesh',
  0.95,    // confidence
  true,    // verified
  'correct'
);

// Calculate automation rate
const autoRate = metricsService.getAutomationRate();
console.log(`${autoRate.automationRate}% automated`);
```

### 3. Claim Readiness Engine (`services/claimReadinessEngine.ts`)

**Rule-based scoring** that replaces opaque "75/100" with transparent breakdown:

```typescript
import { claimReadinessEngine } from './services/claimReadinessEngine';

const result = claimReadinessEngine.calculateClaimReadiness({
  chiefComplaint: 'High-grade fever 5 days, headache, weakness',
  diagnosis: 'Dengue Fever',
  icdCode: 'A90',
  icdConfidence: 'high',
  treatmentPlan: 'IV fluids, daily monitoring',
  policyActive: true,
  sumInsured: 500000,
  hospitalBill: 21580,
  policyLimit: 500000,
  investigations: ['CBC', 'ESR', 'CRP', 'Dengue profile'],
  vitalsAbnormal: true,
  consentProvided: true,
  signaturePresent: false
});

console.log(result);
// {
//   totalScore: 82,
//   maxScore: 100,
//   percentage: 82.0,
//   recommendation: "Ready with Minor Gaps",
//   gaps: ['Signature not captured'],
//   breakdown: {
//     chiefComplaint: { score: 10, maxScore: 10, status: 'complete', ... },
//     diagnosis: { score: 10, maxScore: 10, status: 'complete', ... },
//     medicalNecessity: { score: 18, maxScore: 20, status: 'strong', ... },
//     ...
//   },
//   readyForSubmission: true
// }
```

---

## Integration Points

### Step 1: PatientInsuranceStep

Add at end of step:

```typescript
import { metricsService } from './services/metricsService';

// Track workflow progress
await metricsService.trackWorkflowProgress(
  'Prior Authorization',
  'in_progress',
  'PatientInsurance',
  1,  // completed steps
  4   // total steps
);

// Track each field's automation
await metricsService.trackAutomationField(
  'patientName',
  'manual',  // 'auto_filled' | 'copied' | 'derived' | 'calculated' | 'manual'
  patientData.patientName
);

// Track validation results
await metricsService.trackValidation(
  'policy_expiration',
  'policyEndDate',
  isPolicyActive ? 'pass' : 'fail',
  !isPolicyActive ? 'Policy expired on ' + policyEndDate : undefined,
  'warning'
);

// Log audit entry
await metricsService.logAudit({
  action: 'create_case',
  entityType: 'patient_case',
  entityId: caseId,
  source: 'patient_insurance_step'
});
```

### Step 2: ClinicalDetailsStep

```typescript
// Track clinical section completeness
await metricsService.trackClinicalSection('chiefComplaints', 'present', {
  value: chiefComplaints,
  duration: duration
});

// Track ICD coding
await metricsService.trackCodingMetrics({
  diagnosis: 'Dengue Fever',
  icdSuggested: 'A90',
  icdSelected: 'A90',
  method: 'exact',  // 'exact' | 'fuzzy' | 'inference'
  confidence: 'HIGH',
  manualOverride: false
});

// Track AI call if using LLM for diagnosis
await metricsService.trackAiMetrics({
  model: 'gemini-pro',
  prompt: 'What ICD-10 code matches: Dengue Fever',
  latency: 145,  // ms
  tokenCount: 12,
  confidence: 0.95
});
```

### Step 3: AdmissionCostStep

```typescript
// Track billing metrics
await metricsService.trackBillingMetrics({
  hospitalBill: 21580,
  estimatedBill: 41213,
  difference: 19633,
  reason: 'System includes estimated future charges',
  policyLimit: 500000,
  coverage: 41213,
  deduction: 0,
  violation: null
});
```

### Step 4: DocumentsGenerateStep

```typescript
// Calculate claim readiness before generating PA
const readiness = await claimReadinessEngine.calculateClaimReadiness({
  chiefComplaint: clinicalData.chiefComplaints,
  diagnosis: clinicalData.diagnosis,
  icdCode: clinicalData.icdCode,
  // ... all other fields
});

// Save claim readiness
await metricsService.calculateAndSaveClaimReadiness({
  chiefComplaint: readiness.breakdown.chiefComplaint.score,
  diagnosis: readiness.breakdown.diagnosis.score,
  treatment: readiness.breakdown.treatment.score,
  policy: readiness.breakdown.policyValidation.score,
  bill: readiness.breakdown.billingValidation.score,
  investigations: readiness.breakdown.investigations.score,
  medicalNecessity: readiness.breakdown.medicalNecessity.score,
  insurance: readiness.breakdown.insuranceDetails.score,
  consent: readiness.breakdown.patientConsent.score
});

// Track workflow completion
await metricsService.trackWorkflowProgress(
  'Prior Authorization',
  'completed',
  'DocumentsGenerate',
  4,  // all steps completed
  4
);
```

---

## Key Metrics Calculated

### 1. Workflow Completion

```
Workflow Completion = Completed Steps / Total Steps × 100%

Example: 4/4 steps = 100%
```

**Database:** `workflow_metrics` table

### 2. Performance Metrics

Measured using `performance.mark()` and `performance.measure()`:

```
Step Duration = End Time - Start Time

Example:
  PatientInsurance: 8.2 seconds
  ClinicalDetails: 12.5 seconds
  AdmissionCost: 6.1 seconds
  DocumentsGenerate: 4.8 seconds
  Total: 31.6 seconds
```

**Database:** `performance_metrics` table

### 3. Extraction Accuracy

```
Extraction Accuracy = Correct Fields / Total Fields × 100%

Example:
  Correct: 42
  Incorrect: 1
  Missing: 2
  Total: 45
  Accuracy: 42/45 = 93.3%
```

**Database:** `extraction_metrics` table

### 4. Automation Rate

```
Automation Rate = (Auto Filled + Calculated + Derived) / Total Fields × 100%

Breakdown:
  Auto Filled: 25
  Calculated: 8
  Derived: 5
  Manual: 7
  Total: 45
  Rate: (25+8+5)/45 = 88.9%
```

**Database:** `automation_metrics` table

### 5. Claim Readiness Score

**Now with transparent breakdown:**

```
Chief Complaint:        10/10 ✓ Complete
Diagnosis:              10/10 ✓ Complete  
Treatment:             10/10 ✓ Complete
Policy Validation:     10/10 ✓ Complete
Billing Validation:     8/10 ✗ Bill uses 85% of limit
Investigations:        10/10 ✓ Complete
Medical Necessity:     18/20 ✗ Strong but lacks lab confirmation
Insurance Details:     10/10 ✓ Complete
Patient Consent:        8/10 ✗ Signature not captured
---
TOTAL SCORE:           94/100

Recommendation: Ready with Minor Gaps
Ready for Submission: YES
Gaps:
  - Lab results pending (Dengue serology)
  - Patient signature not captured
```

**Database:** `claim_readiness_metrics` table

---

## Pilot Readiness Score

Replaces vague "Production Ready" with scored dimensions:

```typescript
const pilotScore = await metricsService.calculatePilotReadinessScore({
  workflowScore: 25,        // All 4 steps working (0-25)
  securityScore: 5,         // No auth/encryption (0-15)
  auditScore: 8,            // Partial logging (0-15)
  monitoringScore: 0,       // No monitoring (0-15)
  performanceScore: 10,     // Adequate response times (0-15)
  carrierScore: 0,          // No carrier integration (0-10)
  testingScore: 5           // Single case tested (0-10)
});

// Result:
// {
//   workflowScore: 25,
//   securityScore: 5,
//   auditScore: 8,
//   monitoringScore: 0,
//   performanceScore: 10,
//   carrierScore: 0,
//   testingScore: 5,
//   overallScore: 53,        // Out of 100
//   recommendation: "MVP Ready"
// }
```

**Scale:**
- 85-100: Production Ready
- 70-84: Pilot Ready
- 50-69: MVP Ready
- <50: Development Prototype

---

## Audit Trail

Every change is logged:

```
User: system
Action: create_case
Entity: patient_case PA-AIVANA-20260727-7420
Field: patientName
Old: null
New: "A. Paramesh"
Reason: Manual entry
Source: patient_insurance_step
Timestamp: 2026-07-27T04:21:15Z
```

**Database:** `audit_log` table

**Query all changes for a case:**
```typescript
const logs = await utils.api.post('/api/db', {
  action: 'getAuditLog',
  args: { caseId: 'PA-AIVANA-20260727-7420' }
});
```

---

## API Metrics

Track every external API call:

```
Service: Groq
Endpoint: /v1/chat/completions
Method: POST
Latency: 245ms
Status: 200
Success: true
Retry Count: 0
```

**Database:** `api_metrics` table

---

## Error Tracking

```
Type: OcrApiTimeout
Message: Sarvam OCR took >90 seconds
Severity: warning
Recovered: true
Recovery Method: Used manual entry fallback
```

**Database:** `error_metrics` table

---

## How to Query Metrics

### Get Extraction Accuracy for a Case

```typescript
const response = await utils.api.post('/api/db', {
  action: 'getExtractionMetricsByCaseId',
  args: { caseId: 'PA-AIVANA-20260727-7420' }
});

const metrics = response.metrics;
const correct = metrics.filter(m => m.status === 'correct').length;
const total = metrics.length;
const accuracy = (correct / total) * 100;

console.log(`Extraction Accuracy: ${accuracy.toFixed(1)}%`);
```

### Get Claim Readiness

```typescript
const response = await utils.api.post('/api/db', {
  action: 'getClaimReadiness',
  args: { caseId: 'PA-AIVANA-20260727-7420' }
});

const { score, maxScore, gaps, breakdown } = response.data;
console.log(`Claim Readiness: ${score}/${maxScore}`);
console.log('Gaps:', gaps);
console.log('Breakdown:', breakdown);
```

### Get Audit Trail

```typescript
const response = await utils.api.post('/api/db', {
  action: 'getAuditLog',
  args: { caseId: 'PA-AIVANA-20260727-7420' }
});

response.logs.forEach(log => {
  console.log(`${log.timestamp}: ${log.action} ${log.fieldName}`);
});
```

---

## Best Practices

### 1. Always Initialize Case First

```typescript
metricsService.initializeCase(caseId);
```

### 2. Track Automation Type Correctly

```typescript
// Wrong:
await metricsService.trackAutomationField('age', 'auto_filled', 50);

// Right - use correct fill type:
await metricsService.trackAutomationField('age', 'derived', 50);
// ^ because age was calculated from DOB, not auto-filled
```

### 3. Record Confidence Scores

```typescript
// OCR extraction
await metricsService.trackExtractedField(
  'patientName',
  'ocr',
  extractedName,
  null,  // expected value
  0.87,  // OCR confidence from Sarvam
  false, // not manually verified yet
  'pending_review'
);
```

### 4. Mark API Calls

```typescript
const startTime = performance.now();
const response = await groqClient.chat.completions.create({...});
const latency = Math.round(performance.now() - startTime);

await metricsService.trackApiCall({
  service: 'Groq',
  endpoint: '/v1/chat/completions',
  method: 'POST',
  latency,
  statusCode: 200,
  success: true,
  retryCount: 0
});
```

### 5. Log Meaningful Audit Entries

```typescript
// When user corrects ICD code:
await metricsService.logAudit({
  action: 'update_field',
  entityType: 'coding',
  entityId: caseId,
  fieldName: 'icdCode',
  oldValue: 'A91',
  newValue: 'A90',
  reason: 'Corrected dengue subtype based on lab results',
  source: 'clinical_details_step'
});
```

---

## Next Steps

1. **Integrate into workflow components** - Add metric tracking calls to each step
2. **Create metrics dashboard** - Build UI to visualize all metrics
3. **Set alerts** - Flag if extraction accuracy drops below 80% or API latency exceeds threshold
4. **Generate reports** - Export metrics to CSV/PDF for each case
5. **Trend analysis** - Track metrics over time (first 10 cases, first 100, etc.)

---

## Summary

**This metrics system provides:**

✅ Real, measured data (not estimates)  
✅ Transparent scoring (see exactly why score is 82/100)  
✅ Complete audit trail (who changed what, when, why)  
✅ Performance visibility (which steps are slow?)  
✅ Quality tracking (extraction accuracy, automation rate)  
✅ Compliance logging (every action recorded)  
✅ Production readiness assessment (scored dimensions, not opinions)  

**Before:** "Production Ready (96% - we estimate)"  
**After:** "MVP Ready (53/100) - Security 5/15, Monitoring 0/15, Carrier Integration 0/10"

