import React, { useEffect, useState } from 'react';

interface SaveIndicatorProps {
  isSaving?: boolean;
  onSaveComplete?: () => void;
  autoDismissMs?: number;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isSaving = false,
  onSaveComplete,
  autoDismissMs = 2000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [saveTime, setSaveTime] = useState<string>('');
  const [status, setStatus] = useState<'saving' | 'saved'>('saving');

  useEffect(() => {
    if (isSaving) {
      setIsVisible(true);
      setStatus('saving');
      setSaveTime('');
    }
  }, [isSaving]);

  useEffect(() => {
    if (!isSaving && isVisible && status === 'saving') {
      // Transition from saving to saved
      setStatus('saved');
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setSaveTime(`${displayHours}:${minutes} ${ampm}`);
      onSaveComplete?.();

      // Auto-dismiss
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        setStatus('saving');
      }, autoDismissMs);

      return () => clearTimeout(dismissTimer);
    }
  }, [isSaving, isVisible, status, autoDismissMs, onSaveComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 border border-gray-200">
        {status === 'saving' ? (
          <>
            <div className="w-4 h-4 border-2 border-opd-primary/30 border-t-opd-primary rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Saving...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Saved at <span className="font-semibold">{saveTime}</span>
            </span>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
