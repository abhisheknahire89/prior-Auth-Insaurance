import React, { useState } from 'react';
import { ValidationError, getPendingDiagnoses } from '../../utils/wizardValidation';
import { PreAuthRecord } from './types';

interface ValidationModalProps {
  isOpen: boolean;
  errors: ValidationError[];
  step: number;
  record: Partial<PreAuthRecord>;
  onContinue: () => void;
  onFix: () => void;
  onCancel: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  errors,
  step,
  record,
  onContinue,
  onFix,
  onCancel
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const pendingDiagnoses = getPendingDiagnoses(record);
  const hasPendingCodes = pendingDiagnoses.length > 0;

  if (!isOpen || errors.length === 0) return null;

  // Separate errors and warnings
  const errorsList = errors.filter(e => e.severity === 'error');
  const warningsList = errors.filter(e => e.severity === 'warning');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {hasPendingCodes ? 'ICD-10 Codes Required' : 'Required Information Missing'}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Errors */}
          {errorsList.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Please fix the following:</p>
              <ul className="space-y-2">
                {errorsList.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-red-50 p-3 rounded-lg">
                    <span className="text-red-600 flex-shrink-0 mt-0.5">✗</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">{error.message}</p>
                      <p className="text-xs text-red-700 mt-0.5 font-mono">{error.field}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pending Diagnoses */}
          {hasPendingCodes && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-semibold text-gray-700">Diagnoses Needing ICD-10 Codes:</p>
              <ul className="space-y-2">
                {pendingDiagnoses.map((dx, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg">
                    <span className="text-amber-600 flex-shrink-0 mt-0.5">→</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">{dx.diagnosis}</p>
                      <p className="text-xs text-amber-700 mt-0.5">Status: {dx.icd10Code}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Option to Continue with Pending */}
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 rounded"
                />
                <span className="text-xs text-gray-700">
                  <strong>I understand:</strong> Proceeding with pending ICD-10 codes requires manual doctor review before insurance submission.
                </span>
              </label>
            </div>
          )}

          {/* Warnings */}
          {warningsList.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-semibold text-amber-800">⚠️ Warnings:</p>
              {warningsList.map((warning, idx) => (
                <p key={idx} className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  {warning.message}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onFix}
            className="px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            Fix Issues
          </button>
          {hasPendingCodes ? (
            <button
              onClick={onContinue}
              disabled={!confirmed}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                confirmed
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Proceed (Manual Review)
            </button>
          ) : (
            <button
              onClick={onContinue}
              className="px-4 py-2 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
