import { FieldError, FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { FieldValues } from 'react-hook-form';

export function getFieldError(errors: FieldErrors, name: string): string | undefined {
  // Handle nested fields (e.g., 'user.name')
  const fieldNames = name.split('.');
  let error: FieldError | undefined;
  
  // @ts-ignore - Dynamic property access
  error = fieldNames.reduce((obj, key) => obj?.[key], errors);
  
  return error?.message;
}

export function getFirstError(errors: FieldErrors): { name: string; message: string } | null {
  if (!errors) return null;
  
  const errorKeys = Object.keys(errors);
  if (errorKeys.length === 0) return null;
  
  const firstErrorKey = errorKeys[0];
  const error = errors[firstErrorKey] as FieldError & { message: string };
  
  if (error?.message) {
    return { name: firstErrorKey, message: error.message };
  }
  
  // Handle nested errors
  if (typeof error === 'object') {
    const nestedError = getFirstError(error as unknown as FieldErrors);
    if (nestedError) {
      return {
        name: `${firstErrorKey}.${nestedError.name}`,
        message: nestedError.message
      };
    }
  }
  
  return null;
}

export function scrollToFirstError(errors: FieldErrors) {
  const firstError = getFirstError(errors);
  if (!firstError) return;
  
  // Find the form element with the error
  const element = document.querySelector(`[name="${firstError.name}"]`);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
    
    // Focus the element for better accessibility
    if (element instanceof HTMLElement) {
      element.focus({ preventScroll: true });
    }
  }
}

// Helper to create validation schemas with consistent error messages
export const validation = {
  required: (message = 'This field is required') => 
    z.string().min(1, { message }),
  
  email: (message = 'Please enter a valid email address') => 
    z.string().email({ message }),
  
  minLength: (min: number, message?: string) => 
    z.string().min(min, message || `Must be at least ${min} characters`),
  
  maxLength: (max: number, message?: string) => 
    z.string().max(max, message || `Must be at most ${max} characters`),
  
  password: (minLength = 8) => 
    z.string()
      .min(minLength, `Password must be at least ${minLength} characters`)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  
  confirmPassword: (fieldName = 'password', message = 'Passwords do not match') => 
    z.string().refine(
      (data, ctx) => data === (ctx as any).parent[fieldName],
      {
        message,
        path: ['confirmPassword']
      }
    ),
  
  url: (message = 'Please enter a valid URL') =>
    z.string().url({ message }),
  
  number: (message = 'Must be a number') =>
    z.number({ invalid_type_error: message }),
  
  min: (min: number, message?: string) =>
    z.number().min(min, message || `Must be at least ${min}`),
  
  max: (max: number, message?: string) =>
    z.number().max(max, message || `Must be at most ${max}`),
  
  positive: (message = 'Must be a positive number') =>
    z.number().positive({ message }),
  
  nonnegative: (message = 'Must be a non-negative number') =>
    z.number().nonnegative({ message }),
};

// Helper to create form field props with proper accessibility attributes
export function createFieldProps<T extends FieldValues>(
  name: string,
  form: UseFormReturn<T>,
  options?: {
    label?: string;
    required?: boolean;
    description?: string;
    className?: string;
    labelClassName?: string;
    errorClassName?: string;
  }
) {
  const error = getFieldError(form.formState.errors, name);
  
  return {
    name,
    control: form.control,
    label: options?.label,
    description: options?.description,
    className: options?.className,
    labelClassName: options?.labelClassName,
    errorClassName: cn('text-sm text-red-600 mt-1', options?.errorClassName),
    error,
    required: options?.required,
    'aria-invalid': !!error,
    'aria-required': options?.required,
    'aria-describedby': error ? `${name}-error` : undefined,
  };
}
