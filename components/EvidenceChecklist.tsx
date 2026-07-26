import React, { useMemo } from 'react';
import { ClinicalDetails } from './PreAuthWizard/types';

interface EvidenceChecklistProps {
  clinical: Partial<ClinicalDetails>;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
}

export const EvidenceChecklist: React.FC<EvidenceChecklistProps> = ({ clinical }) => {
  const checklist = useMemo((): ChecklistItem[] => {
    return [
      {
        id: 'presenting-complaint',
        label: 'Presenting Complaints',
        description: 'Chief complaint and symptoms',
        isComplete: !!(clinical.chiefComplaints?.trim())
      },
      {
        id: 'symptom-duration',
        label: 'Symptom Duration',
        description: 'Duration of present ailment',
        isComplete: !!(clinical.durationOfPresentAilment?.trim())
      },
      {
        id: 'vitals',
        label: 'Vital Signs',
        description: 'BP, pulse, temperature, SpO2, RR',
        isComplete: !!(
          clinical.vitals?.bp ||
          clinical.vitals?.pulse ||
          clinical.vitals?.temp ||
          clinical.vitals?.spo2 ||
          clinical.vitals?.rr
        )
      },
      {
        id: 'clinical-findings',
        label: 'Clinical Findings',
        description: 'Physical examination results',
        isComplete: !!(clinical.relevantClinicalFindings?.trim())
      },
      {
        id: 'history',
        label: 'Past Medical History',
        description: 'Prior conditions and treatments',
        isComplete: !!(clinical.historyOfPresentIllness?.trim())
      },
      {
        id: 'diagnosis',
        label: 'Diagnosis',
        description: 'Clinical diagnosis with ICD-10',
        isComplete: !!(
          clinical.diagnoses &&
          clinical.diagnoses.length > 0 &&
          clinical.diagnoses[clinical.selectedDiagnosisIndex ?? 0]?.icd10Code &&
          clinical.diagnoses[clinical.selectedDiagnosisIndex ?? 0]?.icd10Code !== 'Pending ICD-10'
        )
      },
      {
        id: 'treatment-plan',
        label: 'Treatment Plan',
        description: 'Proposed line of treatment',
        isComplete: !!(
          clinical.proposedLineOfTreatment?.medical ||
          clinical.proposedLineOfTreatment?.surgical ||
          clinical.proposedLineOfTreatment?.investigation
        )
      },
      {
        id: 'justification',
        label: 'Hospitalization Justification',
        description: 'Reason for hospital admission',
        isComplete: !!(clinical.reasonForHospitalisation?.trim())
      }
    ];
  }, [clinical]);

  const completedCount = checklist.filter(item => item.isComplete).length;
  const completionPercentage = Math.round((completedCount / checklist.length) * 100);
  const missingCount = checklist.length - completedCount;

  return (
    <div className="bg-white rounded-lg border border-opd-border shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-opd-primary uppercase tracking-wider font-lora">
            Evidence Checklist
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-opd-primary/10 text-opd-primary">
            {completedCount}/{checklist.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-opd-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-opd-primary to-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-[9px] text-opd-text-secondary font-semibold">
          {completionPercentage}% Complete
        </p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map(item => (
          <div
            key={item.id}
            className={`p-2.5 rounded-lg border transition-colors ${
              item.isComplete
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                item.isComplete
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-amber-300'
              }`}>
                {item.isComplete && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${
                  item.isComplete ? 'text-emerald-900' : 'text-amber-900'
                }`}>
                  {item.label}
                </p>
                <p className={`text-[9px] mt-0.5 ${
                  item.isComplete ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Missing Items Summary */}
      {missingCount > 0 && (
        <div className="pt-2 border-t border-opd-border/50">
          <div className="bg-amber-50 rounded-lg p-2.5 text-[9px]">
            <p className="text-amber-900 font-semibold">
              {missingCount} {missingCount === 1 ? 'item' : 'items'} needed
            </p>
            <p className="text-amber-700 mt-1">
              Complete remaining evidence items before submission for better approval chances.
            </p>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {missingCount === 0 && (
        <div className="pt-2 border-t border-opd-border/50">
          <div className="bg-emerald-50 rounded-lg p-2.5 text-[9px] text-emerald-900 font-semibold flex items-center gap-1.5">
            <span>✓</span> All evidence collected
          </div>
        </div>
      )}
    </div>
  );
};
