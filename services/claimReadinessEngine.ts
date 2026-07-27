/**
 * services/claimReadinessEngine.ts
 *
 * Rule-based Claim Readiness scoring engine.
 * Evaluates each required section and calculates a transparent, explainable score.
 */

export interface ClaimReadinessBreakdown {
  chiefComplaint: { score: number; maxScore: number; status: string; reason: string };
  diagnosis: { score: number; maxScore: number; status: string; reason: string };
  treatment: { score: number; maxScore: number; status: string; reason: string };
  policyValidation: { score: number; maxScore: number; status: string; reason: string };
  billingValidation: { score: number; maxScore: number; status: string; reason: string };
  investigations: { score: number; maxScore: number; status: string; reason: string };
  medicalNecessity: { score: number; maxScore: number; status: string; reason: string };
  insuranceDetails: { score: number; maxScore: number; status: string; reason: string };
  patientConsent: { score: number; maxScore: number; status: string; reason: string };
}

export interface ClaimReadinessResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  recommendation: string;
  breakdown: ClaimReadinessBreakdown;
  gaps: string[];
  readyForSubmission: boolean;
}

class ClaimReadinessEngine {
  /**
   * Evaluate Chief Complaint section
   */
  evaluateChiefComplaint(chiefComplaint?: string, duration?: number): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!chiefComplaint) {
      score = 0;
      status = 'missing';
      reason = 'Chief complaint not documented';
    } else if (chiefComplaint.length < 10) {
      score = 5;
      status = 'incomplete';
      reason = 'Chief complaint too brief';
    } else if (chiefComplaint.length < 50) {
      score = 8;
      status = 'present';
      reason = 'Chief complaint documented but lacks detail';
    } else {
      score = 10;
      status = 'complete';
      reason = 'Chief complaint well-documented';
    }

    // Bonus for duration
    if (duration) {
      if (duration <= 1) {
        score = Math.min(10, score + 2);
        reason += '; acute presentation';
      }
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Diagnosis section
   */
  evaluateDiagnosis(primaryDiagnosis?: string, icdCode?: string, confidence?: string): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!primaryDiagnosis) {
      score = 0;
      status = 'missing';
      reason = 'Primary diagnosis not documented';
    } else if (!icdCode) {
      score = 5;
      status = 'incomplete';
      reason = 'Diagnosis documented but ICD-10 code missing';
    } else if (confidence === 'low') {
      score = 6;
      status = 'pending_review';
      reason = 'Diagnosis documented but confidence low';
    } else if (confidence === 'medium') {
      score = 8;
      status = 'present';
      reason = 'Diagnosis and code present with medium confidence';
    } else {
      score = 10;
      status = 'complete';
      reason = 'Diagnosis confirmed with high-confidence ICD-10 code';
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Treatment Plan section
   */
  evaluateTreatmentPlan(treatmentPlan?: string, procedures?: string[]): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!treatmentPlan || treatmentPlan.trim().length === 0) {
      score = 0;
      status = 'missing';
      reason = 'Treatment plan not documented';
    } else if (treatmentPlan.length < 20) {
      score = 5;
      status = 'incomplete';
      reason = 'Treatment plan documented but lacks detail';
    } else if (!procedures || procedures.length === 0) {
      score = 8;
      status = 'present';
      reason = 'Treatment plan documented without specific procedures';
    } else {
      score = 10;
      status = 'complete';
      reason = `Treatment plan with ${procedures.length} specific procedure(s)`;
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Policy Validation
   */
  evaluatePolicyValidation(policyActive?: boolean, sumInsured?: number, policyType?: string): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!policyType) {
      score = 0;
      status = 'missing';
      reason = 'Insurance policy details not found';
    } else if (!policyActive) {
      score = 3;
      status = 'critical_error';
      reason = 'Policy is expired or inactive';
    } else if (!sumInsured || sumInsured === 0) {
      score = 5;
      status = 'incomplete';
      reason = 'Policy details incomplete - sum insured missing';
    } else {
      score = 10;
      status = 'complete';
      reason = `Policy active with ₹${sumInsured.toLocaleString()} coverage`;
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Billing Validation
   */
  evaluateBillingValidation(hospitalBill?: number, policyLimit?: number): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!hospitalBill) {
      score = 0;
      status = 'missing';
      reason = 'Hospital bill not documented';
    } else if (!policyLimit) {
      score = 5;
      status = 'incomplete';
      reason = 'Bill documented but policy limit unclear';
    } else if (hospitalBill > policyLimit) {
      score = 3;
      status = 'warning';
      reason = `Bill (₹${hospitalBill}) exceeds policy limit (₹${policyLimit})`;
    } else if (hospitalBill > policyLimit * 0.8) {
      score = 7;
      status = 'present';
      reason = `Bill (₹${hospitalBill}) uses 80%+ of policy limit`;
    } else {
      score = 10;
      status = 'complete';
      reason = `Bill (₹${hospitalBill}) within policy limit`;
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Investigations
   */
  evaluateInvestigations(investigations?: string[]): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!investigations || investigations.length === 0) {
      score = 2;
      status = 'missing';
      reason = 'No investigations documented or ordered';
    } else if (investigations.length === 1) {
      score = 5;
      status = 'incomplete';
      reason = 'Limited investigations - only 1 test ordered';
    } else if (investigations.length <= 3) {
      score = 8;
      status = 'present';
      reason = `${investigations.length} investigations documented`;
    } else {
      score = 10;
      status = 'complete';
      reason = `Comprehensive investigations (${investigations.length} tests)`;
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Medical Necessity (weighted heavily)
   */
  evaluateMedicalNecessity(
    chiefComplaint?: string,
    vitalsAbnormal?: boolean,
    investigationsOrdered?: boolean,
    admissionJustified?: boolean
  ): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    const evidence = [];

    if (chiefComplaint) evidence.push('chief complaint');
    if (vitalsAbnormal) evidence.push('abnormal vitals');
    if (investigationsOrdered) evidence.push('investigations');
    if (admissionJustified) evidence.push('justified admission');

    if (evidence.length === 0) {
      score = 0;
      status = 'missing';
      reason = 'No medical necessity documentation';
    } else if (evidence.length === 1) {
      score = 5;
      status = 'weak';
      reason = `Weak medical necessity: only ${evidence[0]} documented`;
    } else if (evidence.length === 2) {
      score = 12;
      status = 'moderate';
      reason = `Medical necessity supported by ${evidence.join(' + ')}`;
    } else if (evidence.length === 3) {
      score = 16;
      status = 'strong';
      reason = `Strong medical necessity: ${evidence.join(' + ')}`;
    } else {
      score = 20;
      status = 'compelling';
      reason = 'Compelling medical necessity with complete documentation';
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Insurance Details
   */
  evaluateInsuranceDetails(policyNumber?: string, insurerName?: string, tpaName?: string): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!policyNumber) {
      score = 0;
      status = 'missing';
      reason = 'Policy number not documented';
    } else if (!insurerName && !tpaName) {
      score = 3;
      status = 'incomplete';
      reason = 'Policy number present but insurer/TPA not identified';
    } else if (!insurerName) {
      score = 7;
      status = 'present';
      reason = `TPA identified but insurer not documented`;
    } else {
      score = 10;
      status = 'complete';
      reason = `Complete insurance details: ${insurerName}${tpaName ? ` via ${tpaName}` : ''}`;
    }

    return { score, status, reason };
  }

  /**
   * Evaluate Patient Consent
   */
  evaluatePatientConsent(consentProvided?: boolean, signaturePresent?: boolean): {
    score: number;
    status: string;
    reason: string;
  } {
    let score = 0;
    let status = 'missing';
    let reason = '';

    if (!consentProvided) {
      score = 0;
      status = 'critical_error';
      reason = 'No patient consent documented';
    } else if (!signaturePresent) {
      score = 5;
      status = 'incomplete';
      reason = 'Consent given but signature not captured';
    } else {
      score = 10;
      status = 'complete';
      reason = 'Informed consent documented and signed';
    }

    return { score, status, reason };
  }

  /**
   * Calculate overall claim readiness
   */
  calculateClaimReadiness(claimData: {
    chiefComplaint?: string;
    diagnosis?: string;
    icdCode?: string;
    icdConfidence?: string;
    duration?: number;
    treatmentPlan?: string;
    procedures?: string[];
    policyActive?: boolean;
    policyNumber?: string;
    insurerName?: string;
    tpaName?: string;
    sumInsured?: number;
    hospitalBill?: number;
    policyLimit?: number;
    investigations?: string[];
    vitalsAbnormal?: boolean;
    investigationsOrdered?: boolean;
    admissionJustified?: boolean;
    consentProvided?: boolean;
    signaturePresent?: boolean;
  }): ClaimReadinessResult {
    // Evaluate each section
    const chiefComplaint = this.evaluateChiefComplaint(claimData.chiefComplaint, claimData.duration);
    const diagnosis = this.evaluateDiagnosis(claimData.diagnosis, claimData.icdCode, claimData.icdConfidence);
    const treatment = this.evaluateTreatmentPlan(claimData.treatmentPlan, claimData.procedures);
    const policyValidation = this.evaluatePolicyValidation(claimData.policyActive, claimData.sumInsured, claimData.policyNumber);
    const billingValidation = this.evaluateBillingValidation(claimData.hospitalBill, claimData.policyLimit);
    const investigations = this.evaluateInvestigations(claimData.investigations);
    const medicalNecessity = this.evaluateMedicalNecessity(
      claimData.chiefComplaint,
      claimData.vitalsAbnormal,
      claimData.investigationsOrdered,
      claimData.admissionJustified
    );
    const insuranceDetails = this.evaluateInsuranceDetails(claimData.policyNumber, claimData.insurerName, claimData.tpaName);
    const patientConsent = this.evaluatePatientConsent(claimData.consentProvided, claimData.signaturePresent);

    // Calculate totals
    const totalScore =
      chiefComplaint.score +
      diagnosis.score +
      treatment.score +
      policyValidation.score +
      billingValidation.score +
      investigations.score +
      medicalNecessity.score +
      insuranceDetails.score +
      patientConsent.score;

    const maxScore = 10 + 10 + 10 + 10 + 10 + 10 + 20 + 10 + 10; // 100
    const percentage = (totalScore / maxScore) * 100;

    // Identify gaps
    const gaps: string[] = [];
    if (chiefComplaint.status === 'missing') gaps.push(chiefComplaint.reason);
    if (diagnosis.status === 'missing' || diagnosis.status === 'pending_review') gaps.push(diagnosis.reason);
    if (treatment.status === 'missing' || treatment.status === 'incomplete') gaps.push(treatment.reason);
    if (policyValidation.status === 'critical_error' || policyValidation.status === 'missing') gaps.push(policyValidation.reason);
    if (billingValidation.status === 'warning' || billingValidation.status === 'missing') gaps.push(billingValidation.reason);
    if (investigations.status === 'missing') gaps.push(investigations.reason);
    if (medicalNecessity.status === 'weak' || medicalNecessity.status === 'missing') gaps.push(medicalNecessity.reason);
    if (insuranceDetails.status === 'missing' || insuranceDetails.status === 'incomplete') gaps.push(insuranceDetails.reason);
    if (patientConsent.status === 'critical_error' || patientConsent.status === 'missing') gaps.push(patientConsent.reason);

    // Determine recommendation
    let recommendation = 'Not Ready';
    if (percentage >= 95) recommendation = 'Ready for Submission - All requirements met';
    else if (percentage >= 85) recommendation = 'Ready with Minor Gaps - Review recommended before submission';
    else if (percentage >= 70) recommendation = 'Needs Attention - Address documented gaps';
    else if (percentage >= 50) recommendation = 'Requires Significant Work - Multiple critical gaps';
    else recommendation = 'Not Ready - Critical sections missing';

    const readyForSubmission = percentage >= 85;

    return {
      totalScore,
      maxScore,
      percentage: Math.round(percentage * 10) / 10,
      recommendation,
      breakdown: {
        chiefComplaint: { score: chiefComplaint.score, maxScore: 10, status: chiefComplaint.status, reason: chiefComplaint.reason },
        diagnosis: { score: diagnosis.score, maxScore: 10, status: diagnosis.status, reason: diagnosis.reason },
        treatment: { score: treatment.score, maxScore: 10, status: treatment.status, reason: treatment.reason },
        policyValidation: { score: policyValidation.score, maxScore: 10, status: policyValidation.status, reason: policyValidation.reason },
        billingValidation: { score: billingValidation.score, maxScore: 10, status: billingValidation.status, reason: billingValidation.reason },
        investigations: { score: investigations.score, maxScore: 10, status: investigations.status, reason: investigations.reason },
        medicalNecessity: { score: medicalNecessity.score, maxScore: 20, status: medicalNecessity.status, reason: medicalNecessity.reason },
        insuranceDetails: { score: insuranceDetails.score, maxScore: 10, status: insuranceDetails.status, reason: insuranceDetails.reason },
        patientConsent: { score: patientConsent.score, maxScore: 10, status: patientConsent.status, reason: patientConsent.reason }
      },
      gaps,
      readyForSubmission
    };
  }
}

export const claimReadinessEngine = new ClaimReadinessEngine();
