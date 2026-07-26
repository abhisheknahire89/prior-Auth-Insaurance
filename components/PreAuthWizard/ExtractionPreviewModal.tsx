import React, { useState } from 'react';
import { ExtractedPatientData } from '../../services/documentExtractionService';
import { PatientRecord, InsurancePolicyDetails } from './types';

interface ExtractionPreviewModalProps {
  isOpen: boolean;
  extractedData: ExtractedPatientData | null;
  confidence: number;
  documentName: string;
  onConfirm: (patient: Partial<PatientRecord>, insurance: Partial<InsurancePolicyDetails>) => void;
  onCancel: () => void;
}

export const ExtractionPreviewModal: React.FC<ExtractionPreviewModalProps> = ({
  isOpen,
  extractedData,
  confidence,
  documentName,
  onConfirm,
  onCancel,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedPatientName, setEditedPatientName] = useState(extractedData?.patient?.name || '');
  const [editedPolicyNumber, setEditedPolicyNumber] = useState(extractedData?.insurance?.policy_number || '');
  const [editedInsurerName, setEditedInsurerName] = useState(extractedData?.insurance?.insurance_company || '');

  if (!isOpen || !extractedData) return null;

  const handleConfirm = () => {
    onConfirm(
      {
        patientName: editedPatientName || extractedData.patient?.name,
        age: extractedData.patient?.age,
        gender: extractedData.patient?.gender,
        mobileNumber: extractedData.patient?.phone,
        city: extractedData.patient?.city,
      },
      {
        policyNumber: editedPolicyNumber || extractedData.insurance?.policy_number,
        insurerName: editedInsurerName || extractedData.insurance?.insurance_company,
        tpaName: extractedData.insurance?.tpa_name,
        sumInsured: extractedData.insurance?.sum_insured,
        policyEndDate: extractedData.insurance?.valid_till,
      }
    );
  };

  const confidenceColor = confidence >= 0.7 ? 'green' : confidence >= 0.5 ? 'yellow' : 'red';
  const confidenceLabel = confidence >= 0.7 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex-1">
            <h2 className="font-bold text-lg text-opd-primary font-lora">Extraction Preview</h2>
            <p className="text-xs text-opd-text-secondary mt-1">{documentName}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
            confidenceColor === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            confidenceColor === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span>●</span> {confidenceLabel} ({Math.round(confidence * 100)}%)
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {!editMode ? (
            // Preview Mode
            <div className="space-y-4">
              {/* Patient Section */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-opd-primary uppercase tracking-wider">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Name</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.patient?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Age</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.patient?.age || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Gender</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.patient?.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Phone</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.patient?.phone || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Insurance Section */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-opd-primary uppercase tracking-wider">Insurance Details</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <p className="text-opd-text-secondary font-semibold">Company</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.insurance?.insurance_company || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Policy Number</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.insurance?.policy_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Sum Insured</p>
                    <p className="text-opd-text-primary font-mono">₹{extractedData.insurance?.sum_insured || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">TPA</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.insurance?.tpa_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-opd-text-secondary font-semibold">Valid Till</p>
                    <p className="text-opd-text-primary font-mono">{extractedData.insurance?.valid_till || '—'}</p>
                  </div>
                </div>
              </div>

              {confidence < 0.7 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <strong>Note:</strong> Low confidence extraction. Please review and edit fields before confirming.
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-opd-text-secondary">Patient Name</label>
                <input
                  type="text"
                  value={editedPatientName}
                  onChange={(e) => setEditedPatientName(e.target.value)}
                  className="form-input mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-opd-text-secondary">Insurer Name</label>
                <input
                  type="text"
                  value={editedInsurerName}
                  onChange={(e) => setEditedInsurerName(e.target.value)}
                  className="form-input mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-opd-text-secondary">Policy Number</label>
                <input
                  type="text"
                  value={editedPolicyNumber}
                  onChange={(e) => setEditedPolicyNumber(e.target.value)}
                  className="form-input mt-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-3 border-t">
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex-1 btn-secondary py-2 text-sm"
            type="button"
          >
            {editMode ? '← Preview' : '✎ Edit Fields'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary py-2 text-sm"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 btn-primary py-2 text-sm"
            type="button"
          >
            Confirm & Use
          </button>
        </div>
      </div>
    </div>
  );
};
