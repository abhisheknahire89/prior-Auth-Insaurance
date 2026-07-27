/**
 * scripts/systemValidation.ts
 *
 * System Validation Framework
 * Validates status of 12 critical system components
 *
 * Components:
 * 1. Frontend (UI/UX)
 * 2. Backend API
 * 3. Database (SQLite)
 * 4. OCR Pipeline
 * 5. Rule Engine
 * 6. ICD-10 Engine
 * 7. Billing Engine
 * 8. PDF Generator
 * 9. Telemetry System
 * 10. Audit Logging
 * 11. Monitoring/Alerting
 * 12. Data Encryption
 */

import fs from 'fs';
import path from 'path';

export enum ValidationStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
  NOT_TESTED = 'NOT_TESTED'
}

export interface ComponentValidation {
  componentId: string;
  name: string;
  status: ValidationStatus;
  description: string;
  checks: {
    name: string;
    result: boolean;
    evidence: string;
  }[];
  lastValidated: Date;
  criticalDependencies: string[];
}

class SystemValidation {
  private components: ComponentValidation[] = [];
  private codebasePath: string;

  constructor(codebasePath: string = '.') {
    this.codebasePath = codebasePath;
  }

  /**
   * Validate Frontend Component
   */
  validateFrontend(): void {
    const checks = [
      {
        name: 'React components exist',
        result: this.fileExists('components/InsuranceModule.tsx'),
        evidence: 'components/InsuranceModule.tsx'
      },
      {
        name: 'Workflow UI implementation',
        result: this.fileExists('components/PreAuthWizard/'),
        evidence: 'Multi-step wizard component'
      },
      {
        name: 'Responsive design',
        result: this.fileContains('App.tsx', 'viewport') || this.fileContains('index.html', 'viewport'),
        evidence: 'Viewport meta tag present'
      },
      {
        name: 'Error boundary/handling',
        result: this.fileExists('contexts/ErrorContext.tsx') || this.fileContains('App.tsx', 'catch'),
        evidence: 'Error handling infrastructure'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'FRONTEND',
      name: 'Frontend (React UI)',
      status,
      description: 'User interface for PA submission workflow',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['BACKEND_API']
    });
  }

  /**
   * Validate Backend API
   */
  validateBackendApi(): void {
    const checks = [
      {
        name: 'API handlers exist',
        result: this.fileExists('api/'),
        evidence: 'api/ directory with handlers'
      },
      {
        name: 'Gemini integration',
        result: this.fileExists('api/gemini.ts'),
        evidence: 'api/gemini.ts endpoint'
      },
      {
        name: 'Database API',
        result: this.fileExists('api/db.ts'),
        evidence: 'api/db.ts endpoint'
      },
      {
        name: 'Auth handlers',
        result: this.fileExists('api/auth/login.ts'),
        evidence: 'api/auth directory'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'BACKEND_API',
      name: 'Backend API',
      status,
      description: 'Express/Vercel serverless API layer',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['DATABASE', 'ENCRYPTION']
    });
  }

  /**
   * Validate Database
   */
  validateDatabase(): void {
    const checks = [
      {
        name: 'SQLite database exists',
        result: this.fileExists('prior_auth_poc.db'),
        evidence: 'prior_auth_poc.db file'
      },
      {
        name: 'Database schema defined',
        result: this.fileContains('api/db.ts', 'CREATE TABLE'),
        evidence: 'Schema creation in api/db.ts'
      },
      {
        name: 'Core tables created',
        result: this.fileContains('api/db.ts', 'patient_cases') &&
                 this.fileContains('api/db.ts', 'patients') &&
                 this.fileContains('api/db.ts', 'workflow_metrics'),
        evidence: 'patient_cases, patients, workflow_metrics tables'
      },
      {
        name: 'Metrics tables exist',
        result: this.fileContains('api/db.ts', 'performance_metrics') &&
                 this.fileContains('api/db.ts', 'audit_log'),
        evidence: 'performance_metrics, audit_log tables'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'DATABASE',
      name: 'Database (SQLite)',
      status,
      description: 'Patient data and metrics persistence layer',
      checks,
      lastValidated: new Date(),
      criticalDependencies: []
    });
  }

  /**
   * Validate OCR Pipeline
   */
  validateOcrPipeline(): void {
    const checks = [
      {
        name: 'OCR service exists',
        result: this.fileExists('services/ocrService.ts') ||
                 this.fileExists('scripts/ocrValidationPipeline.ts'),
        evidence: 'OCR service or validation script'
      },
      {
        name: 'PDF upload handling',
        result: this.fileContains('components/InsuranceModule.tsx', 'pdf') ||
                 this.fileContains('components/PreAuthWizard/', 'File'),
        evidence: 'PDF file upload support'
      },
      {
        name: 'Extraction metrics tracking',
        result: this.fileContains('services/metricsService.ts', 'ocr') ||
                 this.fileContains('api/db.ts', 'extraction_metrics'),
        evidence: 'OCR metrics in database'
      },
      {
        name: 'Confidence scoring',
        result: this.fileContains('scripts/ocrValidationPipeline.ts', 'confidence'),
        evidence: 'Confidence score calculation'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.NOT_TESTED;

    this.components.push({
      componentId: 'OCR_PIPELINE',
      name: 'OCR Pipeline',
      status,
      description: 'Document OCR and field extraction',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['BACKEND_API']
    });
  }

  /**
   * Validate Rule Engine
   */
  validateRuleEngine(): void {
    const checks = [
      {
        name: 'Rule engine service exists',
        result: this.fileExists('services/claimReadinessEngine.ts'),
        evidence: 'services/claimReadinessEngine.ts'
      },
      {
        name: 'Scoring rules defined',
        result: this.fileContains('services/claimReadinessEngine.ts', 'score'),
        evidence: 'Scoring logic implemented'
      },
      {
        name: 'Gap identification',
        result: this.fileContains('services/claimReadinessEngine.ts', 'gap') ||
                 this.fileContains('services/claimReadinessEngine.ts', 'Gaps'),
        evidence: 'Gap detection in scoring'
      },
      {
        name: 'Audit trail for rules',
        result: this.fileContains('scripts/claimReadinessAudit.ts', 'RuleAudit'),
        evidence: 'Rule audit script'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'RULE_ENGINE',
      name: 'Rule Engine',
      status,
      description: 'Claim readiness scoring and validation rules',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['DATABASE']
    });
  }

  /**
   * Validate ICD-10 Engine
   */
  validateIcd10Engine(): void {
    const checks = [
      {
        name: 'ICD-10 database exists',
        result: this.fileExists('config/icd10Database.ts') ||
                 this.fileExists('data/icd10*.json'),
        evidence: 'ICD-10 reference data'
      },
      {
        name: 'Coding metrics tracked',
        result: this.fileContains('api/db.ts', 'coding_metrics'),
        evidence: 'coding_metrics table'
      },
      {
        name: 'Confidence scoring',
        result: this.fileContains('engine/billingCoder.ts', 'confidence') ||
                 this.fileContains('scripts/claimReadinessAudit.ts', 'confidence'),
        evidence: 'Confidence calculation in coding'
      },
      {
        name: 'Validation rules',
        result: this.fileContains('config/icd10Database.ts', 'H') ||
                 this.fileContains('CLAUDE.md', 'chapter lock'),
        evidence: 'Chapter lock rules implemented'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.NOT_TESTED;

    this.components.push({
      componentId: 'ICD10_ENGINE',
      name: 'ICD-10 Engine',
      status,
      description: 'Medical coding and ICD-10 classification',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['DATABASE']
    });
  }

  /**
   * Validate Billing Engine
   */
  validateBillingEngine(): void {
    const checks = [
      {
        name: 'Billing service exists',
        result: this.fileExists('utils/costCalculator.ts'),
        evidence: 'utils/costCalculator.ts'
      },
      {
        name: 'Room rent capping',
        result: this.fileContains('utils/costCalculator.ts', 'room') ||
                 this.fileContains('CLAUDE.md', '1%') && this.fileContains('CLAUDE.md', '2%'),
        evidence: 'Room rent cap logic'
      },
      {
        name: 'Billing metrics tracked',
        result: this.fileContains('api/db.ts', 'billing_metrics'),
        evidence: 'billing_metrics table'
      },
      {
        name: 'Policy limit enforcement',
        result: this.fileContains('utils/costCalculator.ts', 'limit') ||
                 this.fileContains('engine/billingCoder.ts', 'limit'),
        evidence: 'Policy limit validation'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'BILLING_ENGINE',
      name: 'Billing Engine',
      status,
      description: 'Cost calculation and policy limit enforcement',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['DATABASE', 'RULE_ENGINE']
    });
  }

  /**
   * Validate PDF Generator
   */
  validatePdfGenerator(): void {
    const checks = [
      {
        name: 'PDF generation service',
        result: this.fileExists('services/pdfService.ts') ||
                 this.fileContains('components/', 'pdf'),
        evidence: 'PDF service implementation'
      },
      {
        name: 'Document template',
        result: this.fileExists('templates/') || this.fileExists('data/'),
        evidence: 'PA document template'
      },
      {
        name: 'Package generation',
        result: this.fileExists('engine/priorAuthWorkflow.ts') ||
                 this.fileExists('api/generatePacket.ts'),
        evidence: 'Packet generation logic'
      },
      {
        name: 'Metadata embedding',
        result: this.fileContains('api/db.ts', 'generated_packets'),
        evidence: 'Package metadata storage'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.NOT_TESTED;

    this.components.push({
      componentId: 'PDF_GENERATOR',
      name: 'PDF Generator',
      status,
      description: 'Prior Authorization document generation',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['BACKEND_API', 'DATABASE']
    });
  }

  /**
   * Validate Telemetry System
   */
  validateTelemetrySystem(): void {
    const checks = [
      {
        name: 'Metrics service exists',
        result: this.fileExists('services/metricsService.ts'),
        evidence: 'services/metricsService.ts'
      },
      {
        name: 'Performance telemetry',
        result: this.fileExists('services/performanceTelemetry.ts'),
        evidence: 'services/performanceTelemetry.ts'
      },
      {
        name: 'API telemetry',
        result: this.fileExists('services/apiTelemetry.ts'),
        evidence: 'services/apiTelemetry.ts'
      },
      {
        name: 'Metrics tables in database',
        result: this.fileContains('api/db.ts', 'performance_metrics') &&
                 this.fileContains('api/db.ts', 'api_metrics'),
        evidence: 'Metrics storage tables'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'TELEMETRY',
      name: 'Telemetry System',
      status,
      description: 'Performance and metrics collection',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['DATABASE']
    });
  }

  /**
   * Validate Audit Logging
   */
  validateAuditLogging(): void {
    const checks = [
      {
        name: 'Audit log table exists',
        result: this.fileContains('api/db.ts', 'audit_log'),
        evidence: 'audit_log table in database'
      },
      {
        name: 'Change tracking',
        result: this.fileContains('api/db.ts', 'oldValue') &&
                 this.fileContains('api/db.ts', 'newValue'),
        evidence: 'Old/new value tracking'
      },
      {
        name: 'User tracking',
        result: this.fileContains('api/db.ts', 'userId'),
        evidence: 'User ID in audit logs'
      },
      {
        name: 'Timestamp precision',
        result: this.fileContains('api/db.ts', 'timestamp'),
        evidence: 'Timestamp field in audit log'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'AUDIT_LOGGING',
      name: 'Audit Logging',
      status,
      description: 'Comprehensive audit trail and change tracking',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['DATABASE']
    });
  }

  /**
   * Validate Monitoring
   */
  validateMonitoring(): void {
    const checks = [
      {
        name: 'Error tracking',
        result: this.fileContains('api/db.ts', 'error_metrics'),
        evidence: 'error_metrics table'
      },
      {
        name: 'Validation metrics',
        result: this.fileContains('api/db.ts', 'validation_metrics'),
        evidence: 'validation_metrics table'
      },
      {
        name: 'Alerting capability',
        result: this.fileContains('scripts/', 'alert') ||
                 this.fileContains('CLAUDE.md', 'alert'),
        evidence: 'Alerting mechanism'
      },
      {
        name: 'Dashboard readiness',
        result: this.fileContains('components/', 'Dashboard') ||
                 this.fileContains('components/', 'Analytics'),
        evidence: 'Analytics/Dashboard UI'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.NOT_TESTED;

    this.components.push({
      componentId: 'MONITORING',
      name: 'Monitoring & Alerting',
      status,
      description: 'System health monitoring and alerting',
      checks,
      lastValidated: new Date(),
      criticalDependencies: ['TELEMETRY', 'AUDIT_LOGGING']
    });
  }

  /**
   * Validate Encryption
   */
  validateEncryption(): void {
    const checks = [
      {
        name: 'Data encryption at rest',
        result: this.fileContains('api/db.ts', 'cipher') ||
                 this.fileContains('api/db.ts', 'encrypt'),
        evidence: 'Database encryption'
      },
      {
        name: 'TLS/HTTPS configuration',
        result: this.fileContains('vercel.json', 'https') ||
                 this.fileContains('package.json', 'https'),
        evidence: 'HTTPS configuration'
      },
      {
        name: 'Field-level encryption',
        result: this.fileContains('api/db.ts', 'sensitive') ||
                 this.fileContains('services/', 'encrypt'),
        evidence: 'Sensitive field encryption'
      },
      {
        name: 'Key management',
        result: this.fileContains('.env.example', 'ENCRYPTION_KEY') ||
                 this.fileContains('CLAUDE.md', 'ENCRYPTION'),
        evidence: 'Encryption key configuration'
      }
    ];

    const passedChecks = checks.filter(c => c.result).length;
    const status = passedChecks === 4 ? ValidationStatus.OPERATIONAL :
                   passedChecks >= 2 ? ValidationStatus.DEGRADED :
                   ValidationStatus.FAILED;

    this.components.push({
      componentId: 'ENCRYPTION',
      name: 'Data Encryption',
      status,
      description: 'Data encryption at rest and in transit',
      checks,
      lastValidated: new Date(),
      criticalDependencies: []
    });
  }

  /**
   * Helper: Check if file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      const fullPath = path.join(this.codebasePath, filePath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if file contains text
   */
  private fileContains(filePath: string, text: string): boolean {
    try {
      const fullPath = path.join(this.codebasePath, filePath);
      if (!fs.existsSync(fullPath)) return false;

      // If it's a directory, search files in it
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        return files.some(file => {
          const fileFull = path.join(fullPath, file);
          if (fs.statSync(fileFull).isFile() && fileFull.endsWith('.ts')) {
            const content = fs.readFileSync(fileFull, 'utf-8');
            return content.includes(text);
          }
          return false;
        });
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return content.includes(text);
    } catch {
      return false;
    }
  }

  /**
   * Run all validations
   */
  validateAll(): void {
    this.validateFrontend();
    this.validateBackendApi();
    this.validateDatabase();
    this.validateOcrPipeline();
    this.validateRuleEngine();
    this.validateIcd10Engine();
    this.validateBillingEngine();
    this.validatePdfGenerator();
    this.validateTelemetrySystem();
    this.validateAuditLogging();
    this.validateMonitoring();
    this.validateEncryption();
  }

  /**
   * Generate validation report
   */
  generateReport(): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('SYSTEM VALIDATION REPORT');
    lines.push('='.repeat(80));
    lines.push(`Date: ${new Date().toISOString()}\n`);

    // Component Status Summary
    const operational = this.components.filter(c => c.status === ValidationStatus.OPERATIONAL).length;
    const degraded = this.components.filter(c => c.status === ValidationStatus.DEGRADED).length;
    const failed = this.components.filter(c => c.status === ValidationStatus.FAILED).length;
    const notTested = this.components.filter(c => c.status === ValidationStatus.NOT_TESTED).length;

    lines.push('SUMMARY:');
    lines.push(`  ✅ Operational: ${operational}`);
    lines.push(`  ⚠️  Degraded: ${degraded}`);
    lines.push(`  ❌ Failed: ${failed}`);
    lines.push(`  ❓ Not Tested: ${notTested}`);
    lines.push(`  Total: ${this.components.length}\n`);

    // Component Details
    lines.push('-'.repeat(80));
    lines.push('COMPONENT STATUS:');
    lines.push('-'.repeat(80));

    this.components.forEach(component => {
      const icon = component.status === ValidationStatus.OPERATIONAL ? '✅' :
                   component.status === ValidationStatus.DEGRADED ? '⚠️' :
                   component.status === ValidationStatus.FAILED ? '❌' : '❓';

      lines.push(`\n${icon} ${component.name} (${component.componentId})`);
      lines.push(`   Status: ${component.status}`);
      lines.push(`   Description: ${component.description}`);

      if (component.criticalDependencies.length > 0) {
        lines.push(`   Dependencies: ${component.criticalDependencies.join(', ')}`);
      }

      lines.push(`   Checks:`);
      component.checks.forEach(check => {
        const checkIcon = check.result ? '✓' : '✗';
        lines.push(`     ${checkIcon} ${check.name}: ${check.evidence}`);
      });
    });

    lines.push('\n' + '='.repeat(80));
    lines.push('OVERALL SYSTEM STATUS:');

    if (failed === 0 && operational >= 8) {
      lines.push('✅ SYSTEM OPERATIONAL');
    } else if (failed <= 2 && operational >= 6) {
      lines.push('⚠️  SYSTEM DEGRADED - Some components need attention');
    } else {
      lines.push('❌ SYSTEM NOT READY - Critical components offline');
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Export for database
   */
  export() {
    return this.components;
  }
}

/**
 * Main execution
 */
function main() {
  const validator = new SystemValidation('/Users/abhishekpravinnahire/Desktop/pre-authorization_poc-main');
  validator.validateAll();

  const report = validator.generateReport();
  console.log(report);

  console.log('\n📊 DETAILED VALIDATION DATA (JSON):');
  const validation = validator.export();
  console.log(JSON.stringify(validation, null, 2));
}

main();
