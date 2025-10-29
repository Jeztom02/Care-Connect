import { useState, ChangeEvent } from 'react';

interface UseFormFieldProps {
  id: string;
  name?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}

export const useFormField = ({
  id,
  name,
  type = 'text',
  required = false,
  autoComplete = 'off',
  defaultValue = ''
}: UseFormFieldProps) => {
  const [value, setValue] = useState(defaultValue);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValue(e.target.value);
  };

  return {
    id,
    name: name || id,
    type,
    value,
    onChange,
    required,
    autoComplete,
    'aria-required': required,
    'aria-invalid': required && !value,
  };
};
