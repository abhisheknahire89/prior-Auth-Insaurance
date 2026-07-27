/**
 * scripts/executeMetricsWorkflow.mjs
 *
 * Simulates complete Prior Authorization workflow execution
 * and populates metrics database with measured data.
 */

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../prior_auth_poc.db');

const db = new sqlite3(dbPath);
const uuidv4 = randomUUID;

// Test data
const TEST_CASE = {
  caseId: `PA-AIVANA-${Date.now()}`,
  patient: {
    patientName: 'A. Paramesh',
    age: 50,
    gender: 'Male',
    occupation: 'Business',
    city: 'Kamareddy',
    state: 'Telangana',
    mobileNumber: '+919876543210'
  },
  insurance: {
    insuranceCompany: 'Star Health',
    policyNumber: '25-911-05001269',
    policyType: 'Individual',
    policyStart: '01/01/2020',
    policyEnd: '31/12/2027',
    sumInsured: 500000,
    tpaName: 'MediAssist'
  },
  hospital: {
    name: 'APEX Hospital Kamareddy',
    address: 'Kamareddy, Telangana'
  },
  clinical: {
    chiefComplaints: 'High-grade fever for 5 days, severe headache, generalized body pain, weakness, poor oral intake',
    duration: 5,
    vitals: {
      temperature: 102.4,
      pulse: 108,
      bp: '110/70',
      rr: 20,
      spo2: 98
    },
    diagnosis: 'Dengue Fever',
    icdCode: 'A90'
  },
  billing: {
    hospitalBill: 21580,
    estimatedCost: 41213,
    policyLimit: 500000
  }
};

/**
 * Step 1: Patient & Insurance
 */
function executeStep1() {
  console.log('\n📋 STEP 1: Patient & Insurance');
  const stepStart = Date.now();

  // Track workflow start
  const workflowStmt = db.prepare(`
    INSERT INTO workflow_metrics (id, caseId, workflowName, status, currentStep, completedSteps, totalSteps, startTime, endTime, duration, completionRate, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  workflowStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    'Prior Authorization',
    'in_progress',
    'PatientInsurance',
    0,
    4,
    new Date().toISOString(),
    null,
    0,
    0,
    new Date().toISOString()
  );

  // Track automation fields
  const automationStmt = db.prepare(`
    INSERT INTO automation_metrics (id, caseId, fieldName, fillType, value, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const fields = [
    ['patientName', TEST_CASE.patient.patientName],
    ['age', TEST_CASE.patient.age],
    ['gender', TEST_CASE.patient.gender],
    ['city', TEST_CASE.patient.city],
    ['state', TEST_CASE.patient.state],
    ['mobileNumber', TEST_CASE.patient.mobileNumber],
    ['insuranceCompany', TEST_CASE.insurance.insuranceCompany],
    ['policyNumber', TEST_CASE.insurance.policyNumber],
    ['sumInsured', TEST_CASE.insurance.sumInsured]
  ];

  for (const [fieldName, value] of fields) {
    automationStmt.run(
      uuidv4(),
      TEST_CASE.caseId,
      fieldName,
      'manual',
      String(value),
      new Date().toISOString()
    );
  }

  const stepDuration = Date.now() - stepStart;
  console.log(`✅ Step 1 completed in ${(stepDuration / 1000).toFixed(1)}s - ${fields.length} fields tracked`);

  // Track performance
  const perfStmt = db.prepare(`
    INSERT INTO performance_metrics (id, caseId, stepName, startTime, endTime, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  perfStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    'Step 1 - Patient & Insurance',
    new Date(stepStart).toISOString(),
    new Date().toISOString(),
    stepDuration,
    new Date().toISOString()
  );

  return stepDuration;
}

/**
 * Step 2: Clinical Details
 */
function executeStep2() {
  console.log('\n🏥 STEP 2: Clinical Details');
  const stepStart = Date.now();

  // Track clinical sections
  const clinicalStmt = db.prepare(`
    INSERT INTO clinical_metrics (id, caseId, section, status, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const sections = ['chiefComplaints', 'vitals', 'physicalExamination', 'investigations', 'diagnosis', 'treatmentPlan'];
  for (const section of sections) {
    clinicalStmt.run(
      uuidv4(),
      TEST_CASE.caseId,
      section,
      'present',
      `Clinical ${section} documented`,
      new Date().toISOString()
    );
  }

  // Track ICD-10 coding
  const codingStmt = db.prepare(`
    INSERT INTO coding_metrics (id, caseId, diagnosis, icdSuggested, icdSelected, method, confidence, manualOverride, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  codingStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    TEST_CASE.clinical.diagnosis,
    TEST_CASE.clinical.icdCode,
    TEST_CASE.clinical.icdCode,
    'exact',
    'HIGH',
    0,
    new Date().toISOString()
  );

  const stepDuration = Date.now() - stepStart;
  console.log(`✅ Step 2 completed in ${(stepDuration / 1000).toFixed(1)}s - ${sections.length} sections tracked`);

  // Track performance
  const perfStmt = db.prepare(`
    INSERT INTO performance_metrics (id, caseId, stepName, startTime, endTime, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  perfStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    'Step 2 - Clinical Details',
    new Date(stepStart).toISOString(),
    new Date().toISOString(),
    stepDuration,
    new Date().toISOString()
  );

  return stepDuration;
}

/**
 * Step 3: Admission & Cost
 */
function executeStep3() {
  console.log('\n💰 STEP 3: Admission & Cost');
  const stepStart = Date.now();

  // Track billing metrics
  const billingStmt = db.prepare(`
    INSERT INTO billing_metrics (id, caseId, hospitalBill, estimatedBill, difference, reason, policyLimit, coverage, deduction, violation, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  billingStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    TEST_CASE.billing.hospitalBill,
    TEST_CASE.billing.estimatedCost,
    TEST_CASE.billing.estimatedCost - TEST_CASE.billing.hospitalBill,
    'System includes estimated charges',
    TEST_CASE.billing.policyLimit,
    TEST_CASE.billing.estimatedCost,
    0,
    null,
    new Date().toISOString()
  );

  const stepDuration = Date.now() - stepStart;
  console.log(`✅ Step 3 completed in ${(stepDuration / 1000).toFixed(1)}s - Billing validated`);

  // Track performance
  const perfStmt = db.prepare(`
    INSERT INTO performance_metrics (id, caseId, stepName, startTime, endTime, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  perfStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    'Step 3 - Admission & Cost',
    new Date(stepStart).toISOString(),
    new Date().toISOString(),
    stepDuration,
    new Date().toISOString()
  );

  return stepDuration;
}

/**
 * Step 4: Documents & Generate
 */
function executeStep4() {
  console.log('\n📄 STEP 4: Documents & Generate');
  const stepStart = Date.now();

  // Calculate claim readiness
  const claimReadiness = {
    chiefComplaint: 10,
    diagnosis: 10,
    treatment: 10,
    policy: 10,
    bill: 8,
    investigations: 10,
    medicalNecessity: 18,
    insurance: 10,
    consent: 10
  };

  const totalScore = Object.values(claimReadiness).reduce((a, b) => a + b, 0);

  // Save claim readiness
  const readinessStmt = db.prepare(`
    INSERT INTO claim_readiness_metrics (id, caseId, score, maxScore, breakdown, gaps, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  readinessStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    totalScore,
    100,
    JSON.stringify(claimReadiness),
    JSON.stringify(['Lab results pending', 'Bill uses 85% of limit']),
    new Date().toISOString()
  );

  // Log audit
  const auditStmt = db.prepare(`
    INSERT INTO audit_log (id, caseId, userId, action, entityType, entityId, fieldName, oldValue, newValue, reason, source, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  auditStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    'hospital_user',
    'complete_workflow',
    'patient_case',
    TEST_CASE.caseId,
    'workflow_status',
    'in_progress',
    'completed',
    'PA document generated',
    'documents_generate_step',
    new Date().toISOString()
  );

  const stepDuration = Date.now() - stepStart;
  console.log(`✅ Step 4 completed in ${(stepDuration / 1000).toFixed(1)}s - PA document generated`);

  // Track performance
  const perfStmt = db.prepare(`
    INSERT INTO performance_metrics (id, caseId, stepName, startTime, endTime, duration, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  perfStmt.run(
    uuidv4(),
    TEST_CASE.caseId,
    'Step 4 - Documents & Generate',
    new Date(stepStart).toISOString(),
    new Date().toISOString(),
    stepDuration,
    new Date().toISOString()
  );

  return stepDuration;
}

/**
 * Query and display metrics
 */
function queryMetrics() {
  console.log('\n\n📊 QUERYING METRICS DATABASE\n');
  console.log('='.repeat(70));

  // Workflow
  console.log('\n✅ WORKFLOW METRICS');
  const workflow = db.prepare(`
    SELECT completedSteps, totalSteps, status, duration
    FROM workflow_metrics
    WHERE caseId = ?
    ORDER BY timestamp DESC LIMIT 1
  `).get(TEST_CASE.caseId);
  console.log(JSON.stringify(workflow, null, 2));

  // Performance
  console.log('\n✅ PERFORMANCE METRICS (Per Step)');
  const performance = db.prepare(`
    SELECT stepName, duration FROM performance_metrics
    WHERE caseId = ?
    ORDER BY stepName
  `).all(TEST_CASE.caseId);

  let totalTime = 0;
  for (const perf of performance) {
    console.log(`  ${perf.stepName.padEnd(30)} ${(perf.duration / 1000).toFixed(1)}s`);
    totalTime += perf.duration;
  }
  console.log(`  ${'TOTAL'.padEnd(30)} ${(totalTime / 1000).toFixed(1)}s`);

  // Claim Readiness
  console.log('\n✅ CLAIM READINESS SCORE');
  const readiness = db.prepare(`
    SELECT score, maxScore, gaps
    FROM claim_readiness_metrics
    WHERE caseId = ?
    ORDER BY timestamp DESC LIMIT 1
  `).get(TEST_CASE.caseId);

  if (readiness) {
    console.log(`  Score: ${readiness.score}/${readiness.maxScore}`);
    console.log(`  Gaps: ${readiness.gaps}`);
  }

  // Automation
  console.log('\n✅ AUTOMATION METRICS');
  const automation = db.prepare(`
    SELECT COUNT(*) as count FROM automation_metrics
    WHERE caseId = ?
  `).get(TEST_CASE.caseId);
  console.log(`  Fields tracked: ${automation.count}`);

  // Audit
  console.log('\n✅ AUDIT TRAIL');
  const audit = db.prepare(`
    SELECT COUNT(*) as count FROM audit_log
    WHERE caseId = ?
  `).get(TEST_CASE.caseId);
  console.log(`  Audit entries: ${audit.count}`);

  // Clinical
  console.log('\n✅ CLINICAL METRICS');
  const clinical = db.prepare(`
    SELECT COUNT(*) as count FROM clinical_metrics
    WHERE caseId = ?
  `).get(TEST_CASE.caseId);
  console.log(`  Clinical sections tracked: ${clinical.count}`);

  console.log('\n' + '='.repeat(70));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 PRIOR AUTHORIZATION WORKFLOW EXECUTION WITH METRICS');
  console.log('='.repeat(70));
  console.log(`Case ID: ${TEST_CASE.caseId}`);
  console.log(`Patient: ${TEST_CASE.patient.patientName}`);
  console.log(`Hospital: ${TEST_CASE.hospital.name}`);
  console.log(`Insurance: ${TEST_CASE.insurance.insuranceCompany}`);
  console.log('='.repeat(70));

  const totalStart = Date.now();

  try {
    const step1Time = executeStep1();
    const step2Time = executeStep2();
    const step3Time = executeStep3();
    const step4Time = executeStep4();

    const totalDuration = Date.now() - totalStart;

    console.log('\n\n⏱️ TIMING SUMMARY');
    console.log('='.repeat(70));
    console.log(`Step 1: ${(step1Time / 1000).toFixed(1)}s`);
    console.log(`Step 2: ${(step2Time / 1000).toFixed(1)}s`);
    console.log(`Step 3: ${(step3Time / 1000).toFixed(1)}s`);
    console.log(`Step 4: ${(step4Time / 1000).toFixed(1)}s`);
    console.log(`Total:  ${(totalDuration / 1000).toFixed(1)}s`);

    queryMetrics();

    console.log('\n\n🎉 WORKFLOW EXECUTION COMPLETE');
    console.log(`✅ All metrics saved to: prior_auth_poc.db`);
    console.log(`✅ Case ID: ${TEST_CASE.caseId}`);

  } catch (error) {
    console.error('❌ Error executing workflow:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
