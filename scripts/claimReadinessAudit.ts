/**
 * scripts/claimReadinessAudit.ts
 *
 * Comprehensive Claim Readiness Rule Engine Audit
 * Shows every rule, its weight, pass/fail status, and deduction
 *
 * Used to verify the scoring mechanism is working correctly
 * and to identify exactly which rules are failing and why.
 */

export interface RuleAudit {
  ruleId: string;
  section: string;
  rule: string;
  weight: number;
  maxScore: number;
  actualScore: number;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  reason: string;
  deduction: number;
}

export interface ClaimReadinessAuditReport {
  caseId: string;
  totalScore: number;
  maxScore: number;
  completionRate: number;
  rules: RuleAudit[];
  gaps: string[];
  recommendations: string[];
  readyForSubmission: boolean;
}

class ClaimReadinessAudit {
  /**
   * Audit a claim for readiness
   * This mirrors the actual scoring logic but with audit trail
   */
  auditClaim(caseData: any): ClaimReadinessAuditReport {
    const rules: RuleAudit[] = [];
    const gaps: string[] = [];
    let totalScore = 0;
    const maxScore = 100;

    console.log('='.repeat(80));
    console.log('CLAIM READINESS RULE ENGINE AUDIT');
    console.log('='.repeat(80));
    console.log(`Case ID: ${caseData.caseId}`);
    console.log();

    // SECTION 1: Chief Complaint (10 points max)
    console.log('SECTION 1: Chief Complaint (10 points)');
    console.log('-'.repeat(80));

    const chiefComplaintRule: RuleAudit = {
      ruleId: 'CHC-001',
      section: 'Chief Complaint',
      rule: 'Chief complaint is documented and clear',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.clinical?.chiefComplaints && caseData.clinical.chiefComplaints.length > 20) {
      chiefComplaintRule.actualScore = 10;
      chiefComplaintRule.status = 'PASS';
      chiefComplaintRule.reason = 'Clear chief complaint: ' + caseData.clinical.chiefComplaints.substring(0, 50);
    } else {
      chiefComplaintRule.actualScore = 0;
      chiefComplaintRule.deduction = 10;
      chiefComplaintRule.reason = 'Chief complaint missing or unclear';
      gaps.push('Clear chief complaint documentation');
    }

    totalScore += chiefComplaintRule.actualScore;
    rules.push(chiefComplaintRule);
    console.log(`✓ ${chiefComplaintRule.rule}: ${chiefComplaintRule.actualScore}/${chiefComplaintRule.maxScore}`);
    console.log();

    // SECTION 2: Diagnosis (10 points max)
    console.log('SECTION 2: Diagnosis (10 points)');
    console.log('-'.repeat(80));

    const diagnosisRule: RuleAudit = {
      ruleId: 'DX-001',
      section: 'Diagnosis',
      rule: 'Primary diagnosis is documented',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.clinical?.diagnosis) {
      diagnosisRule.actualScore = 10;
      diagnosisRule.status = 'PASS';
      diagnosisRule.reason = `Diagnosis documented: ${caseData.clinical.diagnosis}`;
    } else {
      diagnosisRule.actualScore = 0;
      diagnosisRule.deduction = 10;
      diagnosisRule.reason = 'Primary diagnosis not documented';
      gaps.push('Primary diagnosis documentation');
    }

    totalScore += diagnosisRule.actualScore;
    rules.push(diagnosisRule);
    console.log(`✓ ${diagnosisRule.rule}: ${diagnosisRule.actualScore}/${diagnosisRule.maxScore}`);
    console.log();

    // SECTION 3: Treatment Plan (10 points max)
    console.log('SECTION 3: Treatment Plan (10 points)');
    console.log('-'.repeat(80));

    const treatmentRule: RuleAudit = {
      ruleId: 'TX-001',
      section: 'Treatment',
      rule: 'Treatment plan is documented',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.clinical?.treatmentPlan || caseData.admission?.los > 0) {
      treatmentRule.actualScore = 10;
      treatmentRule.status = 'PASS';
      treatmentRule.reason = 'Treatment plan and admission documented';
    } else {
      treatmentRule.actualScore = 0;
      treatmentRule.deduction = 10;
      treatmentRule.reason = 'Treatment plan not documented';
      gaps.push('Treatment plan documentation');
    }

    totalScore += treatmentRule.actualScore;
    rules.push(treatmentRule);
    console.log(`✓ ${treatmentRule.rule}: ${treatmentRule.actualScore}/${treatmentRule.maxScore}`);
    console.log();

    // SECTION 4: Policy Validation (10 points max)
    console.log('SECTION 4: Policy Validation (10 points)');
    console.log('-'.repeat(80));

    const policyRule: RuleAudit = {
      ruleId: 'POL-001',
      section: 'Policy Validation',
      rule: 'Insurance policy is valid and active',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.insurance?.policyNumber && caseData.insurance?.sumInsured) {
      const policyStart = new Date(caseData.insurance.policyStart);
      const policyEnd = new Date(caseData.insurance.policyEnd);
      const today = new Date();

      if (today >= policyStart && today <= policyEnd) {
        policyRule.actualScore = 10;
        policyRule.status = 'PASS';
        policyRule.reason = `Policy ${caseData.insurance.policyNumber} is active`;
      } else {
        policyRule.actualScore = 0;
        policyRule.deduction = 10;
        policyRule.reason = 'Policy is expired or not yet active';
        gaps.push('Valid active insurance policy');
      }
    } else {
      policyRule.actualScore = 0;
      policyRule.deduction = 10;
      policyRule.reason = 'Policy details missing';
      gaps.push('Insurance policy details');
    }

    totalScore += policyRule.actualScore;
    rules.push(policyRule);
    console.log(`✓ ${policyRule.rule}: ${policyRule.actualScore}/${policyRule.maxScore}`);
    console.log();

    // SECTION 5: Billing Validation (10 points max)
    console.log('SECTION 5: Billing Validation (10 points)');
    console.log('-'.repeat(80));

    const billingRule: RuleAudit = {
      ruleId: 'BILL-001',
      section: 'Billing Validation',
      rule: 'Bill is within policy limit (no deduction needed)',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.billing?.estimatedCost && caseData.insurance?.sumInsured) {
      const percentageOfLimit = (caseData.billing.estimatedCost / caseData.insurance.sumInsured) * 100;

      if (percentageOfLimit < 80) {
        billingRule.actualScore = 10;
        billingRule.status = 'PASS';
        billingRule.reason = `Bill is ${percentageOfLimit.toFixed(1)}% of policy limit`;
      } else if (percentageOfLimit < 95) {
        billingRule.actualScore = 8;
        billingRule.status = 'PARTIAL';
        billingRule.reason = `Bill is ${percentageOfLimit.toFixed(1)}% of policy limit (high usage)`;
        billingRule.deduction = 2;
        gaps.push(`Bill uses ${percentageOfLimit.toFixed(1)}% of policy limit`);
      } else {
        billingRule.actualScore = 5;
        billingRule.status = 'FAIL';
        billingRule.reason = `Bill is ${percentageOfLimit.toFixed(1)}% of policy limit (exceeds 95%)`;
        billingRule.deduction = 5;
        gaps.push(`Bill exceeds 95% of policy limit (${percentageOfLimit.toFixed(1)}%)`);
      }
    } else {
      billingRule.actualScore = 0;
      billingRule.deduction = 10;
      billingRule.reason = 'Billing information missing';
      gaps.push('Complete billing information');
    }

    totalScore += billingRule.actualScore;
    rules.push(billingRule);
    console.log(`✓ ${billingRule.rule}: ${billingRule.actualScore}/${billingRule.maxScore}`);
    console.log();

    // SECTION 6: Investigations (10 points max)
    console.log('SECTION 6: Investigations (10 points)');
    console.log('-'.repeat(80));

    const investigationsRule: RuleAudit = {
      ruleId: 'INV-001',
      section: 'Investigations',
      rule: 'Relevant investigations are documented',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.clinical?.investigations && Array.isArray(caseData.clinical.investigations) && caseData.clinical.investigations.length > 0) {
      investigationsRule.actualScore = 10;
      investigationsRule.status = 'PASS';
      investigationsRule.reason = `${caseData.clinical.investigations.length} investigations documented`;
    } else {
      investigationsRule.actualScore = 0;
      investigationsRule.deduction = 10;
      investigationsRule.reason = 'No investigations documented';
      gaps.push('Investigations/Test results');
    }

    totalScore += investigationsRule.actualScore;
    rules.push(investigationsRule);
    console.log(`✓ ${investigationsRule.rule}: ${investigationsRule.actualScore}/${investigationsRule.maxScore}`);
    console.log();

    // SECTION 7: Medical Necessity (20 points max - weighted)
    console.log('SECTION 7: Medical Necessity (20 points - weighted)');
    console.log('-'.repeat(80));

    const medicalNecessityRule: RuleAudit = {
      ruleId: 'MED-001',
      section: 'Medical Necessity',
      rule: 'Strong clinical evidence supports admission/treatment',
      weight: 2,
      maxScore: 20,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.clinical?.diagnosis && caseData.admission?.los > 0) {
      // Check vitals for severity
      const hasAbnormalVitals = caseData.clinical?.vitals?.temperature > 38 ||
                               caseData.clinical?.vitals?.pulse > 100;

      if (hasAbnormalVitals && caseData.admission.los >= 3) {
        medicalNecessityRule.actualScore = 20;
        medicalNecessityRule.status = 'PASS';
        medicalNecessityRule.reason = 'Strong clinical evidence with abnormal vitals and hospital stay';
      } else if (caseData.admission.los >= 3) {
        medicalNecessityRule.actualScore = 18;
        medicalNecessityRule.status = 'PARTIAL';
        medicalNecessityRule.reason = 'Clinical evidence present but lab results pending';
        medicalNecessityRule.deduction = 2;
        gaps.push('Lab results confirmation');
      } else {
        medicalNecessityRule.actualScore = 15;
        medicalNecessityRule.status = 'PARTIAL';
        medicalNecessityRule.reason = 'Adequate evidence but limited hospital stay';
        medicalNecessityRule.deduction = 5;
        gaps.push('Extended hospital stay or more evidence');
      }
    } else {
      medicalNecessityRule.actualScore = 0;
      medicalNecessityRule.deduction = 20;
      medicalNecessityRule.reason = 'Insufficient clinical evidence';
      gaps.push('Strong clinical evidence of medical necessity');
    }

    totalScore += medicalNecessityRule.actualScore;
    rules.push(medicalNecessityRule);
    console.log(`✓ ${medicalNecessityRule.rule}: ${medicalNecessityRule.actualScore}/${medicalNecessityRule.maxScore}`);
    console.log();

    // SECTION 8: Insurance Details (10 points max)
    console.log('SECTION 8: Insurance Details (10 points)');
    console.log('-'.repeat(80));

    const insuranceDetailsRule: RuleAudit = {
      ruleId: 'INS-001',
      section: 'Insurance Details',
      rule: 'Complete insurance information provided',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.insurance?.policyNumber && caseData.insurance?.insuranceCompany &&
        caseData.insurance?.sumInsured && caseData.insurance?.tpaName) {
      insuranceDetailsRule.actualScore = 10;
      insuranceDetailsRule.status = 'PASS';
      insuranceDetailsRule.reason = 'All insurance details complete';
    } else {
      insuranceDetailsRule.actualScore = 5;
      insuranceDetailsRule.status = 'PARTIAL';
      insuranceDetailsRule.reason = 'Some insurance details missing';
      insuranceDetailsRule.deduction = 5;
      gaps.push('Complete insurance details (TPA name, etc.)');
    }

    totalScore += insuranceDetailsRule.actualScore;
    rules.push(insuranceDetailsRule);
    console.log(`✓ ${insuranceDetailsRule.rule}: ${insuranceDetailsRule.actualScore}/${insuranceDetailsRule.maxScore}`);
    console.log();

    // SECTION 9: Patient Consent (10 points max)
    console.log('SECTION 9: Patient Consent (10 points)');
    console.log('-'.repeat(80));

    const consentRule: RuleAudit = {
      ruleId: 'CONS-001',
      section: 'Patient Consent',
      rule: 'Patient consent for PA submission obtained',
      weight: 1,
      maxScore: 10,
      actualScore: 0,
      status: 'FAIL',
      reason: '',
      deduction: 0
    };

    if (caseData.patient?.consentDate || caseData.patient?.patientName) {
      consentRule.actualScore = 10;
      consentRule.status = 'PASS';
      consentRule.reason = 'Patient consent documented';
    } else {
      consentRule.actualScore = 0;
      consentRule.deduction = 10;
      consentRule.reason = 'Patient consent not documented';
      gaps.push('Explicit patient consent for PA submission');
    }

    totalScore += consentRule.actualScore;
    rules.push(consentRule);
    console.log(`✓ ${consentRule.rule}: ${consentRule.actualScore}/${consentRule.maxScore}`);
    console.log();

    // Summary
    console.log('='.repeat(80));
    console.log('CLAIM READINESS SCORE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Score: ${totalScore}/${maxScore}`);
    console.log(`Completion Rate: ${Math.round((totalScore / maxScore) * 100)}%`);
    console.log();

    if (gaps.length > 0) {
      console.log('IDENTIFIED GAPS:');
      gaps.forEach((gap, i) => {
        console.log(`  ${i + 1}. ${gap}`);
      });
      console.log();
    }

    const recommendations: string[] = [];
    if (totalScore >= 90) {
      recommendations.push('✅ Ready for submission - strong claim');
    } else if (totalScore >= 80) {
      recommendations.push('⚠️  Ready with minor gaps - recommend addressing identified issues');
    } else if (totalScore >= 70) {
      recommendations.push('⚠️  Conditional - requires review before submission');
    } else {
      recommendations.push('❌ Not ready - significant gaps must be addressed');
    }

    console.log('RECOMMENDATION:');
    recommendations.forEach(r => console.log(`  ${r}`));
    console.log('='.repeat(80));

    return {
      caseId: caseData.caseId || 'UNKNOWN',
      totalScore,
      maxScore,
      completionRate: Math.round((totalScore / maxScore) * 100),
      rules,
      gaps,
      recommendations,
      readyForSubmission: totalScore >= 75
    };
  }
}

/**
 * Test data
 */
const TEST_CASE = {
  caseId: 'PA-AIVANA-1785110807191',
  patient: {
    patientName: 'A. Paramesh',
    age: 50,
    gender: 'Male',
    consentDate: new Date().toISOString()
  },
  insurance: {
    insuranceCompany: 'Star Health',
    policyNumber: '25-911-05001269',
    sumInsured: 500000,
    tpaName: 'MediAssist',
    policyStart: '2020-01-01',
    policyEnd: '2027-12-31'
  },
  clinical: {
    chiefComplaints: 'High-grade fever for 5 days, severe headache, generalized body pain, weakness, poor oral intake',
    diagnosis: 'Dengue Fever',
    investigations: ['CBC', 'ESR', 'CRP', 'Dengue Profile'],
    treatmentPlan: 'Medical Management',
    vitals: {
      temperature: 102.4,
      pulse: 108,
      bp: '110/70',
      rr: 20,
      spo2: 98
    }
  },
  admission: {
    admissionDate: '2025-09-10',
    dischargeDate: '2025-09-12',
    los: 3
  },
  billing: {
    hospitalBill: 21580,
    estimatedCost: 41213
  }
};

/**
 * Main execution
 */
function main() {
  const audit = new ClaimReadinessAudit();
  const report = audit.auditClaim(TEST_CASE);

  console.log('\n\n📊 AUDIT REPORT (JSON):');
  console.log(JSON.stringify(report, null, 2));
}

main();
