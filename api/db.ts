import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Determine database path depending on Vercel serverless vs local environment
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const dbPath = isVercel
  ? path.join('/tmp', 'prior_auth_poc.db')
  : path.resolve(process.cwd(), 'prior_auth_poc.db');

// Helper to get db connection and ensure tables exist
let _dbInstance: Database.Database | null = null;
function getDb() {
  if (!_dbInstance) {
    // If running in Vercel temp, make sure dir exists (should exist)
    if (isVercel) {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    _dbInstance = new Database(dbPath);
    
    // Initialize schema
    _dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS patient_cases (
        id TEXT PRIMARY KEY,
        updatedAt TEXT,
        data TEXT
      );

      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patientName TEXT,
        mobileNumber TEXT,
        uhid TEXT,
        data TEXT
      );

      CREATE TABLE IF NOT EXISTS icd_corrections (
        caseId TEXT,
        originalAiCode TEXT,
        humanCorrectedCode TEXT,
        clinicalContext TEXT,
        reasonForCorrection TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS generated_packets (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        data TEXT,
        createdAt TEXT
      );

      -- Metrics Tables
      CREATE TABLE IF NOT EXISTS workflow_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        workflowName TEXT,
        status TEXT,
        currentStep TEXT,
        completedSteps INTEGER,
        totalSteps INTEGER,
        startTime TEXT,
        endTime TEXT,
        duration INTEGER,
        completionRate REAL,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        stepName TEXT,
        startTime TEXT,
        endTime TEXT,
        duration INTEGER,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS extraction_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        fieldName TEXT,
        source TEXT,
        extractedValue TEXT,
        expectedValue TEXT,
        confidence REAL,
        verified INTEGER,
        status TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS automation_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        fieldName TEXT,
        fillType TEXT,
        value TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS validation_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        validationType TEXT,
        field TEXT,
        result TEXT,
        errorMessage TEXT,
        severity TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS clinical_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        section TEXT,
        status TEXT,
        details TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS billing_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        hospitalBill REAL,
        estimatedBill REAL,
        difference REAL,
        reason TEXT,
        policyLimit REAL,
        coverage REAL,
        deduction REAL,
        violation TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS coding_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        diagnosis TEXT,
        icdSuggested TEXT,
        icdSelected TEXT,
        method TEXT,
        confidence TEXT,
        manualOverride INTEGER,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS ocr_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        uploadTime INTEGER,
        ocrTime INTEGER,
        pageCount INTEGER,
        confidence REAL,
        retryCount INTEGER,
        failures TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS ai_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        model TEXT,
        prompt TEXT,
        latency INTEGER,
        tokenCount INTEGER,
        fallback TEXT,
        confidence REAL,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS claim_readiness_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        score INTEGER,
        maxScore INTEGER,
        breakdown TEXT,
        gaps TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        userId TEXT,
        action TEXT,
        entityType TEXT,
        entityId TEXT,
        fieldName TEXT,
        oldValue TEXT,
        newValue TEXT,
        reason TEXT,
        source TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS api_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        service TEXT,
        endpoint TEXT,
        method TEXT,
        latency INTEGER,
        statusCode INTEGER,
        success INTEGER,
        retryCount INTEGER,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS error_metrics (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        errorType TEXT,
        message TEXT,
        severity TEXT,
        recovered INTEGER,
        recoveryMethod TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS pilot_readiness_scores (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        workflowScore REAL,
        securityScore REAL,
        auditScore REAL,
        monitoringScore REAL,
        performanceScore REAL,
        carrierScore REAL,
        testingScore REAL,
        overallScore REAL,
        recommendation TEXT,
        timestamp TEXT
      );
    `);
  }
  return _dbInstance;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { action, args } = req.body;
  const db = getDb();

  try {
    switch (action) {
      case 'getPatientCase': {
        const row = db.prepare('SELECT data FROM patient_cases WHERE id = ?').get(args.id) as any;
        return res.status(200).json({ data: row ? JSON.parse(row.data) : null });
      }
      
      case 'savePatientCase': {
        const stmt = db.prepare(`
          INSERT INTO patient_cases (id, updatedAt, data)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            updatedAt = excluded.updatedAt,
            data = excluded.data
        `);
        stmt.run(args.id, args.updatedAt, JSON.stringify(args.data));
        return res.status(200).json({ success: true });
      }
      
      case 'getAllPatientCases': {
        const rows = db.prepare('SELECT data FROM patient_cases ORDER BY updatedAt DESC').all() as any[];
        const cases = rows.map(r => JSON.parse(r.data));
        return res.status(200).json({ cases });
      }
      
      case 'deletePatientCase': {
        db.prepare('DELETE FROM patient_cases WHERE id = ?').run(args.id);
        return res.status(200).json({ success: true });
      }
      
      case 'getPatient': {
        const row = db.prepare('SELECT data FROM patients WHERE id = ?').get(args.id) as any;
        return res.status(200).json({ data: row ? JSON.parse(row.data) : null });
      }
      
      case 'savePatient': {
        const stmt = db.prepare(`
          INSERT INTO patients (id, patientName, mobileNumber, uhid, data)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            patientName = excluded.patientName,
            mobileNumber = excluded.mobileNumber,
            uhid = excluded.uhid,
            data = excluded.data
        `);
        stmt.run(
          args.id,
          args.patientName,
          args.mobileNumber,
          args.uhid || '',
          JSON.stringify(args.data)
        );
        return res.status(200).json({ success: true });
      }
      
      case 'getAllPatients': {
        const rows = db.prepare('SELECT data FROM patients').all() as any[];
        const patients = rows.map(r => JSON.parse(r.data));
        return res.status(200).json({ patients });
      }
      
      case 'searchPatients': {
        const query = `%${args.query.toLowerCase()}%`;
        const rows = db.prepare(`
          SELECT data FROM patients 
          WHERE LOWER(patientName) LIKE ? 
             OR mobileNumber LIKE ? 
             OR LOWER(uhid) LIKE ?
        `).all(query, query, query) as any[];
        const patients = rows.map(r => JSON.parse(r.data));
        return res.status(200).json({ patients });
      }
      
      case 'saveCorrection': {
        const stmt = db.prepare(`
          INSERT INTO icd_corrections (caseId, originalAiCode, humanCorrectedCode, clinicalContext, reasonForCorrection, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          args.caseId,
          args.originalAiCode,
          args.humanCorrectedCode,
          args.clinicalContext,
          args.reasonForCorrection || '',
          args.timestamp
        );
        return res.status(200).json({ success: true });
      }
      
      case 'getAllCorrections': {
        const corrections = db.prepare('SELECT * FROM icd_corrections ORDER BY timestamp DESC').all();
        return res.status(200).json({ corrections });
      }
      
      case 'savePacket': {
        const stmt = db.prepare(`
          INSERT INTO generated_packets (id, patientId, data, createdAt)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            patientId = excluded.patientId,
            data = excluded.data,
            createdAt = excluded.createdAt
        `);
        stmt.run(args.id, args.patientId, JSON.stringify(args.data), args.createdAt);
        return res.status(200).json({ success: true });
      }
      
      case 'getPacket': {
        const row = db.prepare('SELECT data FROM generated_packets WHERE id = ?').get(args.id) as any;
        return res.status(200).json({ data: row ? JSON.parse(row.data) : null });
      }

      // Workflow Metrics
      case 'saveWorkflowMetrics': {
        const stmt = db.prepare(`
          INSERT INTO workflow_metrics (id, caseId, workflowName, status, currentStep, completedSteps, totalSteps, startTime, endTime, duration, completionRate, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.workflowName, args.status, args.currentStep, args.completedSteps, args.totalSteps, args.startTime, args.endTime, args.duration, args.completionRate, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Performance Metrics
      case 'savePerformanceMetrics': {
        const stmt = db.prepare(`
          INSERT INTO performance_metrics (id, caseId, stepName, startTime, endTime, duration, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.stepName, args.startTime, args.endTime, args.duration, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Extraction Metrics
      case 'saveExtractionMetrics': {
        const stmt = db.prepare(`
          INSERT INTO extraction_metrics (id, caseId, fieldName, source, extractedValue, expectedValue, confidence, verified, status, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.fieldName, args.source, args.extractedValue, args.expectedValue, args.confidence, args.verified ? 1 : 0, args.status, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      case 'getExtractionMetricsByCaseId': {
        const rows = db.prepare('SELECT * FROM extraction_metrics WHERE caseId = ? ORDER BY timestamp DESC').all(args.caseId) as any[];
        return res.status(200).json({ metrics: rows });
      }

      // Automation Metrics
      case 'saveAutomationMetrics': {
        const stmt = db.prepare(`
          INSERT INTO automation_metrics (id, caseId, fieldName, fillType, value, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.fieldName, args.fillType, args.value, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Validation Metrics
      case 'saveValidationMetrics': {
        const stmt = db.prepare(`
          INSERT INTO validation_metrics (id, caseId, validationType, field, result, errorMessage, severity, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.validationType, args.field, args.result, args.errorMessage || '', args.severity, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Clinical Metrics
      case 'saveClinicalMetrics': {
        const stmt = db.prepare(`
          INSERT INTO clinical_metrics (id, caseId, section, status, details, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.section, args.status, JSON.stringify(args.details || {}), new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Billing Metrics
      case 'saveBillingMetrics': {
        const stmt = db.prepare(`
          INSERT INTO billing_metrics (id, caseId, hospitalBill, estimatedBill, difference, reason, policyLimit, coverage, deduction, violation, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.hospitalBill, args.estimatedBill, args.difference, args.reason || '', args.policyLimit, args.coverage, args.deduction, args.violation || '', new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Coding Metrics
      case 'saveCodingMetrics': {
        const stmt = db.prepare(`
          INSERT INTO coding_metrics (id, caseId, diagnosis, icdSuggested, icdSelected, method, confidence, manualOverride, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.diagnosis, args.icdSuggested, args.icdSelected, args.method, args.confidence, args.manualOverride ? 1 : 0, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // OCR Metrics
      case 'saveOcrMetrics': {
        const stmt = db.prepare(`
          INSERT INTO ocr_metrics (id, caseId, uploadTime, ocrTime, pageCount, confidence, retryCount, failures, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.uploadTime, args.ocrTime, args.pageCount, args.confidence, args.retryCount, args.failures || '', new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // AI Metrics
      case 'saveAiMetrics': {
        const stmt = db.prepare(`
          INSERT INTO ai_metrics (id, caseId, model, prompt, latency, tokenCount, fallback, confidence, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.model, args.prompt, args.latency, args.tokenCount, args.fallback || '', args.confidence, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Claim Readiness
      case 'saveClaimReadiness': {
        const stmt = db.prepare(`
          INSERT INTO claim_readiness_metrics (id, caseId, score, maxScore, breakdown, gaps, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.score, args.maxScore, JSON.stringify(args.breakdown || {}), JSON.stringify(args.gaps || []), new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      case 'getClaimReadiness': {
        const row = db.prepare('SELECT * FROM claim_readiness_metrics WHERE caseId = ? ORDER BY timestamp DESC LIMIT 1').get(args.caseId) as any;
        if (!row) return res.status(200).json({ data: null });
        return res.status(200).json({ data: { ...row, breakdown: JSON.parse(row.breakdown), gaps: JSON.parse(row.gaps) } });
      }

      // Audit Log
      case 'saveAuditLog': {
        const stmt = db.prepare(`
          INSERT INTO audit_log (id, caseId, userId, action, entityType, entityId, fieldName, oldValue, newValue, reason, source, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.userId || 'system', args.action, args.entityType, args.entityId, args.fieldName || '', args.oldValue || '', args.newValue || '', args.reason || '', args.source || 'ui', new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      case 'getAuditLog': {
        const rows = db.prepare('SELECT * FROM audit_log WHERE caseId = ? ORDER BY timestamp DESC').all(args.caseId) as any[];
        return res.status(200).json({ logs: rows });
      }

      // API Metrics
      case 'saveApiMetrics': {
        const stmt = db.prepare(`
          INSERT INTO api_metrics (id, caseId, service, endpoint, method, latency, statusCode, success, retryCount, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.service, args.endpoint, args.method, args.latency, args.statusCode, args.success ? 1 : 0, args.retryCount, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Error Metrics
      case 'saveErrorMetrics': {
        const stmt = db.prepare(`
          INSERT INTO error_metrics (id, caseId, errorType, message, severity, recovered, recoveryMethod, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.errorType, args.message, args.severity, args.recovered ? 1 : 0, args.recoveryMethod || '', new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      // Pilot Readiness Score
      case 'savePilotReadinessScore': {
        const stmt = db.prepare(`
          INSERT INTO pilot_readiness_scores (id, caseId, workflowScore, securityScore, auditScore, monitoringScore, performanceScore, carrierScore, testingScore, overallScore, recommendation, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(args.id, args.caseId, args.workflowScore, args.securityScore, args.auditScore, args.monitoringScore, args.performanceScore, args.carrierScore, args.testingScore, args.overallScore, args.recommendation, new Date().toISOString());
        return res.status(200).json({ success: true });
      }

      case 'getPilotReadinessScore': {
        const row = db.prepare('SELECT * FROM pilot_readiness_scores WHERE caseId = ? ORDER BY timestamp DESC LIMIT 1').get(args.caseId) as any;
        return res.status(200).json({ data: row || null });
      }

      default:
        return res.status(400).send(`Unsupported db action: ${action}`);
    }
  } catch (err: any) {
    console.error("SQLite endpoint execution error:", err);
    return res.status(500).json({ error: err.message || "Failed to execute database operation" });
  }
}
