import { PreAuthRecord } from '../components/PreAuthWizard/types';

/**
 * Validation errors for each step
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Step 1: Patient & Insurance validation
 */
export const validateStep1 = (record: Partial<PreAuthRecord>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Insurance validation
  if (!record.insurance?.policyNumber?.trim()) {
    errors.push({
      field: 'insurance.policyNumber',
      message: 'Policy Number is required',
      severity: 'error'
    });
  }

  if (!record.insurance?.insurer?.trim()) {
    errors.push({
      field: 'insurance.insurer',
      message: 'Insurer Name is required',
      severity: 'error'
    });
  }

  if (!record.insurance?.tpaName?.trim()) {
    errors.push({
      field: 'insurance.tpaName',
      message: 'TPA Name is required',
      severity: 'error'
    });
  }

  const sumInsured = record.insurance?.sumInsured;
  if (!sumInsured || sumInsured <= 0) {
    errors.push({
      field: 'insurance.sumInsured',
      message: 'Sum Insured must be greater than 0',
      severity: 'error'
    });
  }

  // Patient validation
  if (!record.patient?.patientName?.trim()) {
    errors.push({
      field: 'patient.patientName',
      message: 'Patient Name is required',
      severity: 'error'
    });
  }

  if (!record.patient?.age || record.patient.age <= 0 || record.patient.age > 150) {
    errors.push({
      field: 'patient.age',
      message: 'Valid Age is required',
      severity: 'error'
    });
  }

  if (!record.patient?.gender) {
    errors.push({
      field: 'patient.gender',
      message: 'Gender is required',
      severity: 'error'
    });
  }

  return errors;
};

/**
 * Step 2: Clinical details validation
 */
export const validateStep2 = (record: Partial<PreAuthRecord>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!record.clinical?.chiefComplaints?.trim()) {
    errors.push({
      field: 'clinical.chiefComplaints',
      message: 'Chief Complaints are required',
      severity: 'error'
    });
  }

  // Check for pending ICD-10 codes
  const pendingDiagnoses = record.clinical?.diagnoses?.filter(
    dx => !dx.icd10Code || dx.icd10Code === 'Pending ICD-10' || dx.icd10Code === 'Selection required'
  ) || [];

  if (pendingDiagnoses.length > 0) {
    errors.push({
      field: 'clinical.diagnoses',
      message: `${pendingDiagnoses.length} diagnosis/es need ICD-10 codes`,
      severity: 'error'
    });
  }

  return errors;
};

/**
 * Step 3: Admission & Cost validation
 */
export const validateStep3 = (record: Partial<PreAuthRecord>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!record.admission?.dateOfAdmission) {
    errors.push({
      field: 'admission.dateOfAdmission',
      message: 'Date of Admission is required',
      severity: 'error'
    });
  }

  if (!record.admission?.roomCategory) {
    errors.push({
      field: 'admission.roomCategory',
      message: 'Room Category is required',
      severity: 'error'
    });
  }

  const los = record.admission?.expectedLengthOfStay;
  if (!los || los <= 0) {
    errors.push({
      field: 'admission.expectedLengthOfStay',
      message: 'Expected Length of Stay must be greater than 0',
      severity: 'error'
    });
  }

  if (!record.costEstimate?.totalEstimatedCost || record.costEstimate.totalEstimatedCost <= 0) {
    errors.push({
      field: 'costEstimate.totalEstimatedCost',
      message: 'Cost Estimate is required',
      severity: 'error'
    });
  }

  return errors;
};

/**
 * Check for pending ICD-10 codes before final submission
 * Returns list of diagnoses that need codes
 */
export const getPendingDiagnoses = (record: Partial<PreAuthRecord>): Array<{
  index: number;
  diagnosis: string;
  icd10Code: string;
}> => {
  return (record.clinical?.diagnoses || [])
    .map((dx, idx) => ({
      index: idx,
      diagnosis: dx.diagnosis || '',
      icd10Code: dx.icd10Code || 'Pending ICD-10'
    }))
    .filter(dx => !dx.icd10Code || dx.icd10Code === 'Pending ICD-10' || dx.icd10Code === 'Selection required');
};

/**
 * Get all validation errors for current step
 */
export const getStepValidationErrors = (step: number, record: Partial<PreAuthRecord>): ValidationError[] => {
  switch (step) {
    case 1:
      return validateStep1(record);
    case 2:
      return validateStep2(record);
    case 3:
      return validateStep3(record);
    default:
      return [];
  }
};
