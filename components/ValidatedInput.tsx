import React from 'react';

interface ValidatedInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isValid?: boolean;
  touched?: boolean;
  error?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
  className?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  isValid = false,
  touched = false,
  error,
  required = false,
  type = 'text',
  disabled = false,
  className = '',
}) => {
  const showValidation = touched && (isValid || error);

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="form-label uppercase tracking-wider text-[9px]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full px-3 md:px-3 py-2.5 md:py-2 border rounded-lg transition-colors min-h-[48px] md:min-h-auto text-sm md:text-xs ${
            showValidation
              ? isValid
                ? 'border-green-500 bg-green-50 text-green-900'
                : 'border-red-500 bg-red-50 text-red-900'
              : 'border-gray-300 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {showValidation && (
          <div className="absolute right-3 top-2.5 text-xl">
            {isValid ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
          </div>
        )}
      </div>
      {touched && error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};
