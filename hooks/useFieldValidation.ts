import { useState, useCallback } from 'react';

export interface FieldValidationState {
  [fieldName: string]: {
    isValid: boolean;
    touched: boolean;
    error?: string;
  };
}

export const useFieldValidation = () => {
  const [validationState, setValidationState] = useState<FieldValidationState>({});

  const validateField = useCallback((fieldName: string, value: any, validator: (val: any) => { isValid: boolean; error?: string }) => {
    const result = validator(value);
    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        isValid: result.isValid,
        touched: true,
        error: result.error,
      },
    }));
  }, []);

  const markTouched = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
      },
    }));
  }, []);

  const getFieldState = useCallback((fieldName: string) => {
    return validationState[fieldName] || { isValid: false, touched: false };
  }, [validationState]);

  const getFieldClass = useCallback((fieldName: string) => {
    const state = validationState[fieldName];
    if (!state || !state.touched) return '';
    return state.isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  }, [validationState]);

  return {
    validationState,
    validateField,
    markTouched,
    getFieldState,
    getFieldClass,
  };
};

// Common field validators
export const fieldValidators = {
  required: (value: any) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    return {
      isValid: !isEmpty,
      error: isEmpty ? 'This field is required' : undefined,
    };
  },

  policyNumber: (value: any) => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Policy number is required' };
    }
    return { isValid: true };
  },

  sumInsured: (value: any) => {
    const num = Number(value);
    if (!value || num <= 0) {
      return { isValid: false, error: 'Sum insured must be greater than 0' };
    }
    return { isValid: true };
  },

  age: (value: any) => {
    const num = Number(value);
    if (!value || num <= 0 || num > 150) {
      return { isValid: false, error: 'Valid age required (0-150)' };
    }
    return { isValid: true };
  },

  mobileNumber: (value: any) => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Mobile number is required' };
    }
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return { isValid: false, error: 'Enter a valid 10-digit number' };
    }
    return { isValid: true };
  },

  insurer: (value: any) => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Insurer name is required' };
    }
    return { isValid: true };
  },

  tpaName: (value: any) => {
    if (!value || value === 'Select TPA') {
      return { isValid: false, error: 'TPA name is required' };
    }
    return { isValid: true };
  },
};
