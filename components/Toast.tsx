import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    error: 'bg-red-50 border-red-200',
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }[type];

  const textColor = {
    error: 'text-red-800',
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  }[type];

  const icon = {
    error: '✗',
    success: '✓',
    warning: '⚠',
    info: 'ℹ',
  }[type];

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-50 md:max-w-sm animate-fade-in ${bgColor} border rounded-lg p-4 shadow-lg min-h-[48px] md:min-h-auto`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg shrink-0 ${textColor}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm md:text-sm font-semibold ${textColor}`}>{message}</p>
        </div>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              setIsVisible(false);
              onClose?.();
            }}
            className={`shrink-0 text-sm font-semibold ${textColor} hover:underline transition-colors`}
          >
            {action.label}
          </button>
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
